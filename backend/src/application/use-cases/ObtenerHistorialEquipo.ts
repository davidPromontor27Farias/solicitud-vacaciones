import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { SolicitudVacaciones } from "../../domain/entities/SolicitudVacaciones";

export interface ObtenerHistorialEquipoInput {
    jefeDirectoId: string;
    desde: Date;
    hasta: Date;
}

export class ObtenerHistorialEquipo {
    constructor(private solicitudRepo: SolicitudVacacionesRepository) {}

    async ejecutar(input: ObtenerHistorialEquipoInput): Promise<SolicitudVacaciones[]> {
        return this.solicitudRepo.listarPorEquipo(input.jefeDirectoId, input.desde, input.hasta);
    }
}