import { EstatusSolicitud, SolicitudVacaciones } from "../entities/SolicitudVacaciones";


export interface FiltroHistorial {

    empleadoId: string;
    pagina: number;
    porPagina: number;
}

export interface FiltroPorEstatus {
    estatus: EstatusSolicitud;
    pagina: number;
    porPagina: number;
}

export interface ResultadoPaginado<T>{
    datos: T[];
    total: number;
    pagina: number;
    porPagina: number;
}


export interface SolicitudVacacionesRepository{
    crear(solicitud: SolicitudVacaciones): Promise<void>;
    buscarPorId(id: string): Promise<SolicitudVacaciones | null>;
    actualizar(solicitud: SolicitudVacaciones): Promise<void>;
    listarPorEmpleado(filtro: FiltroHistorial): Promise<ResultadoPaginado <SolicitudVacaciones>>;
    listarAprobadasPorEmpleado(empleadoId: string): Promise<SolicitudVacaciones[]>;
    listarPendientesPorJefeDirecto(jefeDirectoId: string): Promise<SolicitudVacaciones[]>;
    listarPorEquipo(jefeDirectoId: string, desde: Date, hasta: Date): Promise<SolicitudVacaciones[]>;
    listarPorJefeMatricial(jefeMatricialId: string, desde: Date, hasta: Date): Promise<SolicitudVacaciones[]>;
    listarPorEstatus(filtro: FiltroPorEstatus): Promise<ResultadoPaginado<SolicitudVacaciones>>;
    marcarDiasRevocados(solicitudId: string, dias: Date[]): Promise<void>;
}
