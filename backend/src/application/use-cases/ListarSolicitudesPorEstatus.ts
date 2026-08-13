import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { EstatusSolicitud } from "../../domain/entities/SolicitudVacaciones";
import { FiltroPorEstatus, ResultadoPaginado, SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";

export interface SolicitudPorEstatusResultado {
    id: string;
    empleadoId: string;
    numeroEmpleado: string;
    nombre: string;
    departamento: string | null;
    dias: Date[];
    cantidadDias: number;
    backupNombre: string | null;
    motivoRechazo: string | null;
    createdAt: Date;
    resueltoAt: Date | null;
}

export interface ListarSolicitudesPorEstatusInput {
    estatus: EstatusSolicitud;
    pagina: number;
    porPagina: number;
}

export class ListarSolicitudesPorEstatus {
    constructor(
        private solicitudRepo: SolicitudVacacionesRepository,
        private empleadoRepo: EmpleadoRepository,
    ) {}

    async ejecutar(input: ListarSolicitudesPorEstatusInput): Promise<ResultadoPaginado<SolicitudPorEstatusResultado>> {
        const resultado = await this.solicitudRepo.listarPorEstatus(input);
        const empleados = await this.empleadoRepo.listarTodos();
        const empleadosPorId = new Map(empleados.map((e) => [e.id, e]));

        const datos: SolicitudPorEstatusResultado[] = resultado.datos.map((solicitud) => {
            const empleado = empleadosPorId.get(solicitud.empleadoId);
            return {
                id: solicitud.id,
                empleadoId: solicitud.empleadoId,
                numeroEmpleado: empleado?.numeroEmpleado ?? '—',
                nombre: empleado?.nombre ?? 'Empleado no encontrado',
                departamento: empleado?.departamento ?? null,
                dias: solicitud.dias,
                cantidadDias: solicitud.cantidadDias,
                backupNombre: solicitud.backupNombre,
                motivoRechazo: solicitud.motivoRechazo,
                createdAt: solicitud.toProps().createdAt,
                resueltoAt: solicitud.toProps().resueltoAt,
            };
        });

        return { ...resultado, datos };
    }
}
