import { PlanificacionVacacionesRepository } from "../../domain/repositories/PlanificacionVacacionesRepository";
import { PlanificacionVacaciones } from "../../domain/entities/PlanificacionVacaciones";

export class ListarPlanificacion {
    constructor(private planificacionRepo: PlanificacionVacacionesRepository) {}

    async ejecutar(jefeId: string): Promise<PlanificacionVacaciones[]> {
        return this.planificacionRepo.listarPorJefeId(jefeId);
    }
}
