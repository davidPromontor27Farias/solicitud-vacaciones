import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";

export interface ObtenerVacacionesAprobadasEquipoInput {
    jefeId: string;
    desde: Date;
    hasta: Date;
}

export interface VacacionAprobadaResultado {
    solicitudId: string;
    empleadoId: string;
    empleadoNombre: string;
    // Solo los dias que siguen aprobados (no revocados): un dia revocado deja de marcarse
    // en el calendario del jefe.
    dias: Date[];
}

export class ObtenerVacacionesAprobadasEquipo {
    constructor(
        private solicitudRepo: SolicitudVacacionesRepository,
        private empleadoRepo: EmpleadoRepository,
    ) {}

    async ejecutar(input: ObtenerVacacionesAprobadasEquipoInput): Promise<VacacionAprobadaResultado[]> {
        // El jefe puede ver aqui tanto a quienes le reportan de forma directa como
        // matricial: en cualquiera de los dos casos puede llegar a revocarles dias.
        const [directas, matriciales] = await Promise.all([
            this.solicitudRepo.listarPorEquipo(input.jefeId, input.desde, input.hasta),
            this.solicitudRepo.listarPorJefeMatricial(input.jefeId, input.desde, input.hasta),
        ]);

        const porId = new Map<string, typeof directas[number]>();
        for (const solicitud of [...directas, ...matriciales]) {
            if (solicitud.estatus !== 'aprobada') continue;
            porId.set(solicitud.id, solicitud);
        }

        const resultado: VacacionAprobadaResultado[] = [];
        for (const solicitud of porId.values()) {
            const diasActivos = solicitud.diasActivos;
            if (diasActivos.length === 0) continue;

            const empleado = await this.empleadoRepo.buscarPorId(solicitud.empleadoId);
            resultado.push({
                solicitudId: solicitud.id,
                empleadoId: solicitud.empleadoId,
                empleadoNombre: empleado?.nombre ?? 'Empleado',
                dias: diasActivos,
            });
        }

        return resultado;
    }
}
