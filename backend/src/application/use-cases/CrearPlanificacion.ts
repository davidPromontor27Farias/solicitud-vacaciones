import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { PlanificacionVacacionesRepository } from "../../domain/repositories/PlanificacionVacacionesRepository";
import { PlanificacionVacaciones } from "../../domain/entities/PlanificacionVacaciones";
import { IdGenerator } from "../ports/IdGenerator";
import { ValidationError } from "../../shared/errors";

export interface CrearPlanificacionInput {
    jefeId: string;
    empleadoId: string;
    fecha: Date;
    nota?: string | null;
}

export class CrearPlanificacion {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private planificacionRepo: PlanificacionVacacionesRepository,
        private idGenerator: IdGenerator,
    ) {}

    async ejecutar(input: CrearPlanificacionInput, fechaReferencia: Date = new Date()): Promise<PlanificacionVacaciones> {
        const hoy = new Date(Date.UTC(fechaReferencia.getUTCFullYear(), fechaReferencia.getUTCMonth(), fechaReferencia.getUTCDate()));
        if (input.fecha < hoy) {
            throw new ValidationError('No se pueden planear días que ya pasaron');
        }

        const equipo = await this.empleadoRepo.listarEquipoDirecto(input.jefeId);
        const perteneceAlEquipo = equipo.some((e) => e.id === input.empleadoId);
        if (!perteneceAlEquipo) {
            throw new ValidationError('Ese empleado no está a tu cargo');
        }

        const existente = await this.planificacionRepo.buscarPorEmpleadoYFecha(input.empleadoId, input.fecha);
        if (existente) {
            throw new ValidationError('Ya hay una planeación para ese empleado en esa fecha');
        }

        const planificacion = new PlanificacionVacaciones({
            id: this.idGenerator.generar(),
            empleadoId: input.empleadoId,
            jefeId: input.jefeId,
            fecha: input.fecha,
            nota: input.nota ?? null,
        });

        await this.planificacionRepo.crear(planificacion);
        return planificacion;
    }
}
