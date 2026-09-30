import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { EstatusAusentismo } from "../../domain/entities/Ausentismo";
import { AusentismoRepository, ResultadoPaginadoAusentismo } from "../../domain/repositories/AusentismoRepository";

export interface AusentismoPorEstatusResultado {
    id: string;
    empleadoId: string;
    numeroEmpleado: string;
    nombre: string;
    departamento: string | null;
    motivo: string;
    comentario: string;
    dias: Date[];
    cantidadDias: number;
    motivoRechazo: string | null;
    createdAt: Date;
    resueltoAt: Date | null;
}

export interface ListarAusentismosPorEstatusInput {
    estatus: EstatusAusentismo;
    pagina: number;
    porPagina: number;
}

export class ListarAusentismosPorEstatus {
    constructor(
        private ausentismoRepo: AusentismoRepository,
        private empleadoRepo: EmpleadoRepository,
    ) {}

    async ejecutar(input: ListarAusentismosPorEstatusInput): Promise<ResultadoPaginadoAusentismo<AusentismoPorEstatusResultado>> {
        const resultado = await this.ausentismoRepo.listarPorEstatus(input);
        const empleados = await this.empleadoRepo.listarTodos();
        const empleadosPorId = new Map(empleados.map((e) => [e.id, e]));

        const datos = resultado.datos.map((a) => {
            const empleado = empleadosPorId.get(a.empleadoId);
            return {
                id: a.id,
                empleadoId: a.empleadoId,
                numeroEmpleado: empleado?.numeroEmpleado ?? '—',
                nombre: empleado?.nombre ?? 'Empleado no encontrado',
                departamento: empleado?.departamento ?? null,
                motivo: a.motivo,
                comentario: a.comentario,
                dias: a.dias,
                cantidadDias: a.cantidadDias,
                motivoRechazo: a.motivoRechazo,
                createdAt: a.createdAt,
                resueltoAt: a.resueltoAt,
            };
        });
        return { ...resultado, datos };
    }
}
