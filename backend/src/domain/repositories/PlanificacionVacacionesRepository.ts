import { PlanificacionVacaciones } from "../entities/PlanificacionVacaciones";

export interface PlanificacionVacacionesRepository {
    crear(planificacion: PlanificacionVacaciones): Promise<void>;
    buscarPorId(id: string): Promise<PlanificacionVacaciones | null>;
    buscarPorEmpleadoYFecha(empleadoId: string, fecha: Date): Promise<PlanificacionVacaciones | null>;
    listarPorJefeId(jefeId: string): Promise<PlanificacionVacaciones[]>;
    eliminar(id: string): Promise<void>;
}
