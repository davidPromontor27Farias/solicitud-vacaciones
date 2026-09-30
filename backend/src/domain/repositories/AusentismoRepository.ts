import { Ausentismo, EstatusAusentismo } from "../entities/Ausentismo";

export interface FiltroHistorialAusentismo {
    empleadoId: string;
    pagina: number;
    porPagina: number;
}

export interface FiltroAusentismoPorEstatus {
    estatus: EstatusAusentismo;
    pagina: number;
    porPagina: number;
}

export interface ResultadoPaginadoAusentismo<T> {
    datos: T[];
    total: number;
    pagina: number;
    porPagina: number;
}

export interface AusentismoRepository {
    crear(ausentismo: Ausentismo, tx?: unknown): Promise<void>;
    buscarPorId(id: string, tx?: unknown): Promise<Ausentismo | null>;
    actualizar(ausentismo: Ausentismo, tx?: unknown): Promise<void>;
    listarPorEmpleado(filtro: FiltroHistorialAusentismo): Promise<ResultadoPaginadoAusentismo<Ausentismo>>;
    listarPorEstatus(filtro: FiltroAusentismoPorEstatus): Promise<ResultadoPaginadoAusentismo<Ausentismo>>;
    listarAprobadosPorEquipo(jefeDirectoId: string, desde: Date, hasta: Date): Promise<Ausentismo[]>;
}