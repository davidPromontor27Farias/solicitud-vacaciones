import { PlanificacionVacacionesRepository } from "../../domain/repositories/PlanificacionVacacionesRepository";
import { NotFoundError, UnauthorizedError } from "../../shared/errors";

export interface EliminarPlanificacionInput {
    id: string;
    jefeId: string;
}

export class EliminarPlanificacion {
    constructor(private planificacionRepo: PlanificacionVacacionesRepository) {}

    async ejecutar(input: EliminarPlanificacionInput): Promise<void> {
        const planificacion = await this.planificacionRepo.buscarPorId(input.id);
        if (!planificacion) {
            throw new NotFoundError('Planeación no encontrada');
        }
        if (planificacion.jefeId !== input.jefeId) {
            throw new UnauthorizedError('No autorizado');
        }

        await this.planificacionRepo.eliminar(input.id);
    }
}
