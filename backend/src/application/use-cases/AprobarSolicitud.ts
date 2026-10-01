import { EnlaceRevisionGenerator } from "../ports/EnlaceRevisionGenerator"
import { Empleado } from "../../domain/entities/Empleado";
import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { SolicitudVacaciones } from "../../domain/entities/SolicitudVacaciones";
import { EmailNotifier } from "../ports/EmailNotifier";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors";
import { dividirNombres } from "../../shared/texto";
import {TransactionManager} from "../ports/TransactionManager";
import { calcularConsumoSaldo, calcularDiasPasadosYFuturos } from "../../domain/services/consumoSaldo";

function mismoDia(a: Date, b: Date): boolean {
    return a.getTime() === b.getTime();
}

function formatearDias(dias: Date[]): string {
    return [...dias]
        .sort((a, b) => a.getTime() - b.getTime())
        .map((d) => d.toISOString().slice(0, 10))
        .join(', ');
}

export interface AprobarSolicitudInput {
    solicitudId: string;
    aprobadorId: string;
    backupSeleccionado?: string;
    // Si se omite, o si incluye todos los dias solicitados, se aprueba completa (igual que
    // antes). Si es un subconjunto, los dias no incluidos quedan marcados como "rechazados"
    // (nunca aprobados) — distinto de una revocacion, que es para dias que si se aprobaron.
    diasAprobados?: Date[];
}

export class AprobarSolicitud {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
        private emailNotifier: EmailNotifier,
        private enlaceGenerator: EnlaceRevisionGenerator,
        private txtManager: TransactionManager
    ) {}

    async ejecutar(input: AprobarSolicitudInput): Promise<SolicitudVacaciones> {
        const solicitudInicial = await this.solicitudRepo.buscarPorId(input.solicitudId);
        if (!solicitudInicial) {
            throw new NotFoundError('Solicitud no encontrada');
        }

        const empleado = await this.empleadoRepo.buscarPorId(solicitudInicial.empleadoId);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        if (empleado.jefeDirectoId !== input.aprobadorId) {
            throw new UnauthorizedError('No tienes permiso para aprobar esta solicitud');
        }

        const { solicitud, diasAprobados, diasNoAprobados } = await this.txtManager.ejecutar(async (tx) => {
            await this.empleadoRepo.bloquearParaEscritura(empleado.id, tx);

            const solicitud = await this.solicitudRepo.buscarPorId(input.solicitudId, tx);
            if (!solicitud) {
                throw new NotFoundError('Solicitud no encontrada');
            }

            if (solicitud.estaVencida()) {
                throw new ValidationError('Esta solicitud ya venció: el primer día solicitado ya pasó sin haber sido aprobada. Pide al empleado que envíe una nueva solicitud.');
            }

            const opcionesBackup = dividirNombres(solicitud.backupNombre ?? '');
            if (opcionesBackup.length > 1) {
                if (!input.backupSeleccionado?.trim()) {
                    throw new ValidationError('Selecciona quién cubrirá al empleado');
                }
                try {
                    solicitud.seleccionarBackup(input.backupSeleccionado.trim());
                } catch (error) {
                    throw new ValidationError(error instanceof Error ? error.message : 'Backup seleccionado inválido');
                }
            }

            // Determina que dias se aprueban de verdad: si no mandan diasAprobados, o si
            // mandan todos los dias de la solicitud, es una aprobacion completa (igual que
            // antes). Si mandan un subconjunto valido, es una aprobacion parcial.
            let diasAprobados = solicitud.dias;
            if (input.diasAprobados && input.diasAprobados.length > 0 && input.diasAprobados.length < solicitud.dias.length) {
                const invalido = input.diasAprobados.find((dia) => !solicitud.dias.some((d) => mismoDia(d, dia)));
                if (invalido) {
                    throw new ValidationError('Alguno de los días seleccionados no pertenece a esta solicitud');
                }
                diasAprobados = input.diasAprobados;
            } else if (input.diasAprobados && input.diasAprobados.length === 0) {
                throw new ValidationError('Selecciona al menos un día para aprobar, o usa "Rechazar" si no quieres aprobar ninguno');
            }

            const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id, tx);

            const diaSinSaldoVigente = diasAprobados.find((dia) => !saldos.some((s) => s.estaVigente(dia)));
            if (diaSinSaldoVigente) {
                throw new ValidationError(`El empleado ya no cuenta con saldo vigente para el ${diaSinSaldoVigente.toISOString().slice(0, 10)}`);
            }

            const vigentes = saldos.filter((s) => diasAprobados.some((dia) => s.estaVigente(dia)));

            // El descuento real no se aplica aqui: los dias aprobados se quedan en "programados"
            // y solo se convierten en dias disfrutados (restando de los disponibles) cuando su
            // fecha ya paso. Por eso la validacion usa el saldo efectivo (ya descontando lo que
            // otras solicitudes aprobadas de este empleado ya tienen reservado), no el saldo bruto.
            const aprobadasExistentes = await this.solicitudRepo.listarAprobadasPorEmpleado(empleado.id, tx);
            const { pasados, futuros } = calcularDiasPasadosYFuturos(saldos, aprobadasExistentes);

            const totalDisponible = vigentes.reduce((acc, s) => {
                const consumo = calcularConsumoSaldo(s, pasados.get(s.id) ?? 0, futuros.get(s.id) ?? 0);
                return acc + consumo.diasPendientesEfectivo;
            }, 0);
            if (totalDisponible < diasAprobados.length) {
                throw new ValidationError('El empleado ya no cuenta con suficientes días disponibles');
            }

            try {
                solicitud.aprobar();
            } catch (error) {
                throw new ValidationError(error instanceof Error ? error.message : 'No se pudo aprobar la solicitud');
            }

            const diasNoAprobados = solicitud.dias.filter((dia) => !diasAprobados.some((d) => mismoDia(d, dia)));
            if (diasNoAprobados.length > 0) {
                solicitud.marcarDiasRechazados(diasNoAprobados);
            }

            await this.solicitudRepo.actualizar(solicitud, tx);
            if (diasNoAprobados.length > 0) {
                await this.solicitudRepo.marcarDiasRechazados(solicitud.id, diasNoAprobados, tx);
            }

            return { solicitud, diasAprobados, diasNoAprobados };
        });

        await this.notificar(empleado, solicitud, diasAprobados, diasNoAprobados);

        return solicitud;
    }

    private async notificar(
        empleado: Empleado,
        solicitud: SolicitudVacaciones,
        diasAprobados: Date[],
        diasNoAprobados: Date[],
    ): Promise<void> {
        if (empleado.correoPersonal) {
            if (diasNoAprobados.length > 0) {
                await this.emailNotifier.encolar({
                    tipo: 'aprobacion_parcial_empleado',
                    destinatario: empleado.correoPersonal,
                    solicitudId: solicitud.id,
                    datos: {
                        diasAprobados: formatearDias(diasAprobados),
                        diasNoAprobados: formatearDias(diasNoAprobados),
                        cantidadAprobados: String(diasAprobados.length),
                        cantidadNoAprobados: String(diasNoAprobados.length),
                        backup: solicitud.backupNombre ?? '',
                    },
                });
            } else {
                await this.emailNotifier.encolar({
                    tipo: 'aprobacion_empleado',
                    destinatario: empleado.correoPersonal,
                    solicitudId: solicitud.id,
                    datos: { dias: String(diasAprobados.length), backup: solicitud.backupNombre ?? '' },
                });
            }
        }

        if (empleado.recibeNotificacionesMatricial && empleado.jefeMatricialId && empleado.jefeMatricialId !== empleado.jefeDirectoId) {
            const jefeMatricial = await this.empleadoRepo.buscarPorId(empleado.jefeMatricialId);
            if (jefeMatricial?.correoParaSolicitudes) {

                const enlaceToken = this.enlaceGenerator.generar({
                    solicitudId: solicitud.id,
                    jefeId: empleado.jefeMatricialId
                })

                await this.emailNotifier.encolar({
                    tipo: 'aprobacion_jefe_matricial',
                    destinatario: jefeMatricial.correoParaSolicitudes,
                    solicitudId: solicitud.id,
                    datos: { empleado: empleado.nombre, dias: String(diasAprobados.length), enlaceToken },
                });
            }
        }
    }
}