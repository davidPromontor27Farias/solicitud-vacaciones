import { PrismaClient } from "@prisma/client";
import { PlanificacionVacacionesRepository } from "../../../domain/repositories/PlanificacionVacacionesRepository";
import { PlanificacionVacaciones } from "../../../domain/entities/PlanificacionVacaciones";

function toDomain(row: {
    id: string;
    empleadoId: string;
    jefeId: string;
    fecha: Date;
    nota: string | null;
}): PlanificacionVacaciones {
    return new PlanificacionVacaciones({
        id: row.id,
        empleadoId: row.empleadoId,
        jefeId: row.jefeId,
        fecha: row.fecha,
        nota: row.nota,
    });
}

export class PrismaPlanificacionVacacionesRepository implements PlanificacionVacacionesRepository {
    constructor(private prisma: PrismaClient) {}

    async crear(planificacion: PlanificacionVacaciones): Promise<void> {
        const props = planificacion.toProps();
        await this.prisma.planificacionVacaciones.create({
            data: {
                id: props.id,
                empleadoId: props.empleadoId,
                jefeId: props.jefeId,
                fecha: props.fecha,
                nota: props.nota,
            },
        });
    }

    async buscarPorId(id: string): Promise<PlanificacionVacaciones | null> {
        const row = await this.prisma.planificacionVacaciones.findUnique({ where: { id } });
        return row ? toDomain(row) : null;
    }

    async buscarPorEmpleadoYFecha(empleadoId: string, fecha: Date): Promise<PlanificacionVacaciones | null> {
        const row = await this.prisma.planificacionVacaciones.findUnique({
            where: { empleadoId_fecha: { empleadoId, fecha } },
        });
        return row ? toDomain(row) : null;
    }

    async listarPorJefeId(jefeId: string): Promise<PlanificacionVacaciones[]> {
        const rows = await this.prisma.planificacionVacaciones.findMany({
            where: { jefeId },
            orderBy: { fecha: 'asc' },
        });
        return rows.map(toDomain);
    }

    async eliminar(id: string): Promise<void> {
        await this.prisma.planificacionVacaciones.delete({ where: { id } });
    }
}
