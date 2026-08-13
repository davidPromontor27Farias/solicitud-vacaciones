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

export interface CrearSolicitudVacacionesInput {
    empleadoId: string;
    dias: Date[];
}

function inicioDelDiaUtc(fecha: Date): Date {
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

export class CrearSolicitudVacaciones {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
        private emailNotifier: EmailNotifier,
        private idGenerator: IdGenerator,
        private enlaceGenerator: EnlaceRevisionGenerator,
    ) {}

    async ejecutar(input: CrearSolicitudVacacionesInput): Promise<SolicitudVacaciones> {
        const empleado = await this.empleadoRepo.buscarPorId(input.empleadoId);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        const rango = RangoDias.crear(input.dias);

        const hoy = inicioDelDiaUtc(new Date());
        if (inicioDelDiaUtc(rango.primerDia) < hoy) {
            throw new ValidationError('No puedes solicitar días que ya pasaron');
        }

        const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id)

        const diaSinSaldoVigente = rango.valores.find((dia) => !saldos.some((s) => s.estaVigente(dia)));
        if (diaSinSaldoVigente) {
            throw new ValidationError(`No cuentas con saldo vigente para el ${diaSinSaldoVigente.toISOString().slice(0, 10)}`);
        }

        const saldosAplicables = saldos.filter((s) => rango.valores.some((dia) => s.estaVigente(dia)));
        const totalDisponible = saldosAplicables.reduce((acc, s) => acc + s.diasPendientes, 0);

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

        await this.solicitudRepo.crear(solicitud);
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