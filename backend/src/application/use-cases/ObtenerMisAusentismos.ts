import { AusentismoRepository, ResultadoPaginadoAusentismo } from "../../domain/repositories/AusentismoRepository";
import { Ausentismo } from "../../domain/entities/Ausentismo";

export interface ObtenerMisAusentismosInput {
    empleadoId: string;
    pagina: number;
    porPagina: number;
}

export class ObtenerMisAusentismos {
    constructor(private ausentismoRepo: AusentismoRepository) {}

    async ejecutar(input: ObtenerMisAusentismosInput): Promise<ResultadoPaginadoAusentismo<Ausentismo>> {
        return this.ausentismoRepo.listarPorEmpleado(input);
    }
}