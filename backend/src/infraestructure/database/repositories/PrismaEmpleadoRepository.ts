import { Prisma, PrismaClient } from '@prisma/client';
import { Empleado, EmpleadoProps,  } from '../../../domain/entities/Empleado';
import { EmpleadoRepository } from '../../../domain/repositories/EmpleadoRepository';

function toDomain(row: EmpleadoProps): Empleado {

    return new Empleado(row)
}

export class PrismaEmpleadoRepository implements EmpleadoRepository{
    constructor(private prisma: PrismaClient){}

    async buscarPorId(id: string): Promise<Empleado | null> {
        const row = await this.prisma.empleado.findUnique({where: {id}})
        return row ? toDomain(row) : null;
    }

    async buscarPorNumeroEmpleado(numeroEmpleado: string): Promise<Empleado | null> {
        const row = await this.prisma.empleado.findUnique({where: {numeroEmpleado}})
        return row ? toDomain(row) : null;
    }

    async listarEquipoDirecto(jefeDirectoId: string): Promise<Empleado[]> {
        const rows = await this.prisma.empleado.findMany({where: {jefeDirectoId}});
        return rows.map(toDomain);
    }

    async guardar(empleado: Empleado): Promise<void>{
        const props = empleado.toProps();
        await this.prisma.empleado.update({
            where: {id: props.id},
            data: {
                correoPersonal: props.correoPersonal ?? null,
                passwordHash: props.passwordHash ?? null,
                primerAcceso: props.primerAcceso,
                intentosFallidos: props.intentosFallidos,
                bloqueadoHasta: props.bloqueadoHasta ?? null
            }
        })
    }
}