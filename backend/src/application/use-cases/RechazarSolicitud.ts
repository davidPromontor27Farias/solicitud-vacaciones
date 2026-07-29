import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { SolicitudVacaciones } from "../../domain/entities/SolicitudVacaciones";
import { EmailNotifier } from "../ports/EmailNotifier";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors";

export interface RechazarSolicitudInput {
    solicitudId: string;
    aprobadorId: string;
    motivo: string;
}

export class RechazarSolicitud {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
        private emailNotifier: EmailNotifier,
    ) {}

    async ejecutar(input: RechazarSolicitudInput): Promise<SolicitudVacaciones> {
        const solicitud = await this.solicitudRepo.buscarPorId(input.solicitudId);
        if (!solicitud) {
            throw new NotFoundError('Solicitud no encontrada');
        }

        const empleado = await this.empleadoRepo.buscarPorId(solicitud.empleadoId);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        if (empleado.jefeDirectoId !== input.aprobadorId) {
            throw new UnauthorizedError('No tienes permiso para rechazar esta solicitud');
        }

        try {
            solicitud.rechazar(input.motivo);
        } catch (error) {
            throw new ValidationError(error instanceof Error ? error.message : 'No se pudo rechazar la solicitud');
        }
        await this.solicitudRepo.actualizar(solicitud);

        if (empleado.correoPersonal) {
            await this.emailNotifier.encolar({
                tipo: 'solicitud_rechazada',
                destinatario: empleado.correoPersonal,
                solicitudId: solicitud.id,
                datos: { dias: String(solicitud.cantidadDias), motivo: solicitud.motivoRechazo ?? '' },
            });
        }

        return solicitud;
    }
}