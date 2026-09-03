import { EnlaceRevisionGenerator } from "../ports/EnlaceRevisionGenerator"
import { Empleado } from "../../domain/entities/Empleado";
import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { SolicitudVacaciones } from "../../domain/entities/SolicitudVacaciones";
import { EmailNotifier } from "../ports/EmailNotifier";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors";
import { dividirNombres } from "../../shared/texto";

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
    ) {}

    async ejecutar(input: AprobarSolicitudInput): Promise<SolicitudVacaciones> {
        const solicitud = await this.solicitudRepo.buscarPorId(input.solicitudId);
        if (!solicitud) {
            throw new NotFoundError('Solicitud no encontrada');
        }

        const empleado = await this.empleadoRepo.buscarPorId(solicitud.empleadoId);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        if (empleado.jefeDirectoId !== input.aprobadorId) {
            throw new UnauthorizedError('No tienes permiso para aprobar esta solicitud');
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
        const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id);

        const diaSinSaldoVigente = dias.find((dia) => !saldos.some((s) => s.estaVigente(dia)));
        if (diaSinSaldoVigente) {
            throw new ValidationError(`El empleado ya no cuenta con saldo vigente para el ${diaSinSaldoVigente.toISOString().slice(0, 10)}`);
        }

        const vigentes = saldos
            .filter((s) => dias.some((dia) => s.estaVigente(dia)))
            .sort((a, b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime());

        const totalDisponible = vigentes.reduce((acc, s) => acc + s.diasPendientes, 0);
        if (totalDisponible < solicitud.cantidadDias) {
            throw new ValidationError('El empleado ya no cuenta con suficientes días disponibles');
        }

        let restante = solicitud.cantidadDias;
        for (const saldo of vigentes) {
            if (restante === 0) break;
            const aDescontar = Math.min(saldo.diasPendientes, restante);
            if (aDescontar > 0) {
                saldo.descontarDias(aDescontar);
                await this.saldoRepo.guardar(saldo);
                restante -= aDescontar;
            }
        }

        try {
            solicitud.aprobar();
        } catch (error) {
            throw new ValidationError(error instanceof Error ? error.message : 'No se pudo aprobar la solicitud');
        }
        await this.solicitudRepo.actualizar(solicitud);

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