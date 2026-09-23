import { Empleado } from "../../domain/entities/Empleado";
import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { SolicitudVacaciones } from "../../domain/entities/SolicitudVacaciones";
import { RangoDias } from "../../domain/value-objects/RangoDias";
import { EmailNotifier } from "../ports/EmailNotifier";
import { IdGenerator } from "../ports/IdGenerator";
import { EnlaceRevisionGenerator } from "../ports/EnlaceRevisionGenerator";
import { NotFoundError, ValidationError } from "../../shared/errors";
import { calcularConsumoSaldo, calcularDiasPasadosYFuturos } from "../../domain/services/consumoSaldo";
import { TransactionManager } from "../ports/TransactionManager";

export interface CrearSolicitudVacacionesInput {
    empleadoId: string;
    dias: Date[];
}

function inicioDelDiaUtc(fecha: Date): Date {
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

// Politica de vacaciones: toda solicitud debe hacerse con un minimo de 5 dias de
// anticipacion (ni hoy ni los proximos 4 dias se pueden solicitar).
const DIAS_ANTICIPACION_MINIMA = 5;

export class CrearSolicitudVacaciones {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
        private emailNotifier: EmailNotifier,
        private idGenerator: IdGenerator,
        private enlaceGenerator: EnlaceRevisionGenerator,
        private txtManager: TransactionManager,
    ) {}

    async ejecutar(input: CrearSolicitudVacacionesInput): Promise<SolicitudVacaciones> {
        const empleado = await this.empleadoRepo.buscarPorId(input.empleadoId);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        const rango = RangoDias.crear(input.dias);

        const hoy = inicioDelDiaUtc(new Date());
        const primerDiaPermitido = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() + DIAS_ANTICIPACION_MINIMA));
        if (inicioDelDiaUtc(rango.primerDia) < primerDiaPermitido) {
            throw new ValidationError(`Debes solicitar tus vacaciones con al menos ${DIAS_ANTICIPACION_MINIMA} días de anticipación`);
        }

        // Se bloquea al empleado antes de leer su saldo: si dos solicitudes (o una solicitud
        // y una aprobacion) del mismo empleado llegan casi al mismo tiempo, la segunda espera
        // a que la primera termine y valida contra el saldo ya actualizado, en vez de que
        // ambas pasen la validacion con el mismo saldo desactualizado.
        const solicitud = await this.txtManager.ejecutar(async (tx) => {
            await this.empleadoRepo.bloquearParaEscritura(empleado.id, tx);

            const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id, tx);

            const diaSinSaldoVigente = rango.valores.find((dia) => !saldos.some((s) => s.estaVigente(dia)));
            if (diaSinSaldoVigente) {
                throw new ValidationError(`No cuentas con saldo vigente para el ${diaSinSaldoVigente.toISOString().slice(0, 10)}`);
            }

            const saldosAplicables = saldos.filter((s) => rango.valores.some((dia) => s.estaVigente(dia)));

            // Al igual que al aprobar, la disponibilidad se valida contra el saldo efectivo: lo
            // que ya esta reservado por otras solicitudes aprobadas (pasadas o programadas) no
            // se puede volver a solicitar, aunque el saldo bruto todavia no lo refleje.
            const aprobadas = await this.solicitudRepo.listarAprobadasPorEmpleado(empleado.id, tx);
            const { pasados, futuros } = calcularDiasPasadosYFuturos(saldos, aprobadas);
            const totalDisponible = saldosAplicables.reduce((acc, s) => {
                const consumo = calcularConsumoSaldo(s, pasados.get(s.id) ?? 0, futuros.get(s.id) ?? 0);
                return acc + consumo.diasPendientesEfectivo;
            }, 0);

            if (totalDisponible < rango.cantidad) {
                throw new ValidationError('No cuentas con suficientes días disponibles para esta solicitud');
            }

            const solicitud = new SolicitudVacaciones({
                id: this.idGenerator.generar(),
                empleadoId: empleado.id,
                estatus: 'pendiente',
                dias: rango.valores,
                backupNombre: empleado.backupNombre,
                motivoRevocacion: null,
                revocadoPorId: null,
                createdAt: new Date(),
                resueltoAt: null,
            });

            await this.solicitudRepo.crear(solicitud, tx);
            return solicitud;
        });

        await this.notificarJefeDirecto(empleado, solicitud, rango);

        return solicitud;
    }

    private async notificarJefeDirecto(empleado: Empleado, solicitud: SolicitudVacaciones, rango: RangoDias): Promise<void> {
        if (!empleado.jefeDirectoId) return;

        const jefe = await this.empleadoRepo.buscarPorId(empleado.jefeDirectoId);
        if (!jefe?.correoParaSolicitudes) return;

        const enlaceToken = this.enlaceGenerator.generar({
            solicitudId: solicitud.id,
            jefeId: empleado.jefeDirectoId,
        });

        await this.emailNotifier.encolar({
            tipo: 'solicitud_creada',
            destinatario: jefe.correoParaSolicitudes,
            solicitudId: solicitud.id,
            datos: {
                empleado: empleado.nombre,
                dias: String(rango.cantidad),
                primerDia: rango.primerDia.toISOString().slice(0, 10),
                ultimoDia: rango.ultimoDia.toISOString().slice(0, 10),
                enlaceToken,
            },
        });
    }
}