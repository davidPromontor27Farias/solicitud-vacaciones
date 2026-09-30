import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { AusentismoRepository } from "../../domain/repositories/AusentismoRepository";

export interface ObtenerAusentismosAprobadosEquipoInput {
    jefeId: string;
    desde: Date;
    hasta: Date;
}

export interface AusentismoAprobadoResultado {
    ausentismoId: string;
    empleadoId: string;
    empleadoNombre: string;
    motivo: string;
    dias: Date[];
}

export class ObtenerAusentismosAprobadosEquipo {
    constructor(
        private ausentismoRepo: AusentismoRepository,
        private empleadoRepo: EmpleadoRepository,
    ) {}

    async ejecutar(input: ObtenerAusentismosAprobadosEquipoInput): Promise<AusentismoAprobadoResultado[]> {
        const ausentismos = await this.ausentismoRepo.listarAprobadosPorEquipo(input.jefeId, input.desde, input.hasta);

        const resultado: AusentismoAprobadoResultado[] = [];
        for (const ausentismo of ausentismos) {
            const empleado = await this.empleadoRepo.buscarPorId(ausentismo.empleadoId);
            resultado.push({
                ausentismoId: ausentismo.id,
                empleadoId: ausentismo.empleadoId,
                empleadoNombre: empleado?.nombre ?? 'Empleado',
                motivo: ausentismo.motivo,
                dias: ausentismo.dias,
            });
        }
        return resultado;
    }
}
