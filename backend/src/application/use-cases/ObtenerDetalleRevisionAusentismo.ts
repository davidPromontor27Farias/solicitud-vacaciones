import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { AusentismoRepository } from "../../domain/repositories/AusentismoRepository";
import { NotFoundError, UnauthorizedError } from "../../shared/errors";

export interface DetalleRevisionAusentismoInput {
    ausentismoId: string;
    jefeId: string;
}

export interface DetalleRevisionAusentismoResultado {
    id: string;
    empleadoNombre: string;
    motivo: string;
    comentario: string;
    estatus: string;
    dias: string[];
}

export class ObtenerDetalleRevisionAusentismo {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private ausentismoRepo: AusentismoRepository,
    ) {}

    async ejecutar(input: DetalleRevisionAusentismoInput): Promise<DetalleRevisionAusentismoResultado> {
        const ausentismo = await this.ausentismoRepo.buscarPorId(input.ausentismoId);
        if (!ausentismo) throw new NotFoundError('Ausentismo no encontrado');

        const empleado = await this.empleadoRepo.buscarPorId(ausentismo.empleadoId);
        if (!empleado) throw new NotFoundError('Empleado no encontrado');

        if (empleado.jefeDirectoId !== input.jefeId) {
            throw new UnauthorizedError('No tienes permiso para revisar este ausentismo');
        }
        return {
            id: ausentismo.id,
            empleadoNombre: empleado.nombre,
            motivo: ausentismo.motivo,
            comentario: ausentismo.comentario,
            estatus: ausentismo.estatus,
            dias: ausentismo.dias.map((d) => d.toISOString().slice(0, 10)),
        };
    }
}