import { ResultadoPaginado, SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { SolicitudVacaciones } from "../../domain/entities/SolicitudVacaciones";

export interface ObtenerHistorialEmpleadoInput {
    empleadoId: string;
    pagina: number;
    porPagina: number;
}

export class ObtenerHistorialEmpleado {
    constructor(private solicitudRepo: SolicitudVacacionesRepository) {}

    async ejecutar(input: ObtenerHistorialEmpleadoInput): Promise<ResultadoPaginado<SolicitudVacaciones>> {
        return this.solicitudRepo.listarPorEmpleado({
            empleadoId: input.empleadoId,
            pagina: input.pagina,
            porPagina: input.porPagina,
        });
    }
}

