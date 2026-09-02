import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { EnlaceRevisionGenerator } from "../ports/EnlaceRevisionGenerator";

export interface NotificacionSolicitud {
    solicitudId: string;
    empleadoNombre: string;
    dias: Date[];
    createdAt: Date;
    enlaceToken: string;
}

export class ObtenerNotificacionesJefe {
    constructor(
        private solicitudRepo: SolicitudVacacionesRepository,
        private empleadoRepo: EmpleadoRepository,
        private enlaceGenerator: EnlaceRevisionGenerator,
    ) {}

    // Mismo enlaceToken que se manda por correo al crear la solicitud: se regenera aqui
    // al vuelo (es un HMAC sin estado, no hay nada que persistir) para que el jefe pueda
    // llegar a la misma pantalla de revision desde la campana de notificaciones.
    async ejecutar(jefeId: string): Promise<NotificacionSolicitud[]> {
        const pendientes = await this.solicitudRepo.listarPendientesPorJefeDirecto(jefeId);

        const resultado: NotificacionSolicitud[] = [];
        for (const solicitud of pendientes) {
            const empleado = await this.empleadoRepo.buscarPorId(solicitud.empleadoId);
            resultado.push({
                solicitudId: solicitud.id,
                empleadoNombre: empleado?.nombre ?? 'Empleado',
                dias: solicitud.dias,
                createdAt: solicitud.createdAt,
                enlaceToken: this.enlaceGenerator.generar({ solicitudId: solicitud.id, jefeId }),
            });
        }

        return resultado;
    }
}
