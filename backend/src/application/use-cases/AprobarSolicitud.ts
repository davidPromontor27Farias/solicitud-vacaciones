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

export interface AprobarSolicitudInput {
    solicitudId: string;
    aprobadorId: string;
    backupSeleccionado?: string;
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

        // Todo lo que lee y luego decide con base en el saldo del empleado (dias vigentes,
        // solicitudes ya aprobadas) va dentro de la transaccion, despues de tomar el lock:
        // asi, si dos aprobaciones del mismo empleado llegan casi al mismo tiempo, la segunda
        // espera a que la primera termine y vuelve a leer el estado ya actualizado, en vez de
        // validar las dos contra el mismo saldo desactualizado.
        const solicitud = await this.txtManager.ejecutar(async (tx) => {
            await this.empleadoRepo.bloquearParaEscritura(empleado.id, tx);

            const solicitud = await this.solicitudRepo.buscarPorId(input.solicitudId, tx);
            if (!solicitud) {
                throw new NotFoundError('Solicitud no encontrada');
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

            const dias = solicitud.dias;
            const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id, tx);

            const diaSinSaldoVigente = dias.find((dia) => !saldos.some((s) => s.estaVigente(dia)));
            if (diaSinSaldoVigente) {
                throw new ValidationError(`El empleado ya no cuenta con saldo vigente para el ${diaSinSaldoVigente.toISOString().slice(0, 10)}`);
            }

            const vigentes = saldos.filter((s) => dias.some((dia) => s.estaVigente(dia)));

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
            if (totalDisponible < solicitud.cantidadDias) {
                throw new ValidationError('El empleado ya no cuenta con suficientes días disponibles');
            }

            try {
                solicitud.aprobar();
            } catch (error) {
                throw new ValidationError(error instanceof Error ? error.message : 'No se pudo aporbar la solicitud');
            }

            await this.solicitudRepo.actualizar(solicitud, tx);
            return solicitud;
        });

        await this.notificar(empleado, solicitud);

        return solicitud;
    }

    private async notificar(empleado: Empleado, solicitud: SolicitudVacaciones): Promise<void> {
        if (empleado.correoPersonal) {
            await this.emailNotifier.encolar({
                tipo: 'aprobacion_empleado',
                destinatario: empleado.correoPersonal,
                solicitudId: solicitud.id,
                datos: { dias: String(solicitud.cantidadDias), backup: solicitud.backupNombre ?? '' },
            });
        }

        // Si el jefe matricial es la misma persona que el jefe directo (quien acaba de
        // aprobar), no tiene sentido mandarle una notificacion invitandolo a declinar su
        // propia aprobacion.
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
                    datos: { empleado: empleado.nombre, dias: String(solicitud.cantidadDias), enlaceToken },
                });
            }
        }
    }
}