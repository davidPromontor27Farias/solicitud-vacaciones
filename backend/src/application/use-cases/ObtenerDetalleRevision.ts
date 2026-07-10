import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { NotFoundError, UnauthorizedError } from "../../shared/errors";

export interface DetalleRevisionInput {
    solicitudId: string;
    jefeId: string;
}

export interface DetalleRevisionResultado {
    id: string;
    empleadoNombre: string;
    estatus: string;
    dias: string[];
    backupNombre: string | null;
    colisiones: Record<string, string[]>;
}

export class ObtenerDetalleRevision {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
    ) {}

    async ejecutar(input: DetalleRevisionInput): Promise<DetalleRevisionResultado> {
        const solicitud = await this.solicitudRepo.buscarPorId(input.solicitudId);
        if (!solicitud) {
            throw new NotFoundError('Solicitud no encontrada');
        }

        const empleado = await this.empleadoRepo.buscarPorId(solicitud.empleadoId);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        if (empleado.jefeDirectoId !== input.jefeId) {
            throw new UnauthorizedError('No tienes permiso para revisar esta solicitud');
        }

        const dias = solicitud.dias.map((d) => d.toISOString().slice(0, 10));
        const primerDia = solicitud.dias[0];
        const ultimoDia = solicitud.dias[solicitud.dias.length - 1];

        const equipo = await this.empleadoRepo.listarEquipoDirecto(input.jefeId);
        const nombrePorId = new Map(equipo.map((e) => [e.id, e.nombre]));

        const solicitudesEquipo = await this.solicitudRepo.listarPorEquipo(input.jefeId, primerDia, ultimoDia);

        const colisiones: Record<string, string[]> = {};
        for (const otra of solicitudesEquipo) {
            if (otra.id === solicitud.id) continue;
            if (otra.estatus !== 'aprobada') continue;

            for (const d of otra.dias.map((f) => f.toISOString().slice(0, 10))) {
                if (dias.includes(d)) {
                    const nombre = nombrePorId.get(otra.empleadoId) ?? 'Otro empleado';
                    colisiones[d] = [...(colisiones[d] ?? []), nombre];
                }
            }
        }

        return {
            id: solicitud.id,
            empleadoNombre: empleado.nombre,
            estatus: solicitud.estatus,
            dias,
            backupNombre: solicitud.backupNombre,
            colisiones,
        };
    }
}
