import { Prisma, PrismaClient } from '@prisma/client';
import { Empleado, EmpleadoProps,  } from '../../../domain/entities/Empleado';
import { EmpleadoRepository, DatosEmpleadoImportacion } from '../../../domain/repositories/EmpleadoRepository';

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

    async listarTodos(): Promise<Empleado[]> {
        const rows = await this.prisma.empleado.findMany({
            orderBy: [{departamento: 'asc'}, {nombre: 'asc'}]
        });

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

    async upsertDesdeImportacion(datos: DatosEmpleadoImportacion): Promise<{ id: string; esNuevo: boolean }> {
        const existente = await this.prisma.empleado.findUnique({ where: { numeroEmpleado: datos.numeroEmpleado } });

        const camposOpcionales: Pick<Prisma.EmpleadoUncheckedCreateInput, 'sociedad' | 'puesto' | 'departamento' | 'correoPersonal' | 'backupNombre'> = {};
        if (datos.sociedad !== undefined) camposOpcionales.sociedad = datos.sociedad;
        if (datos.puesto !== undefined) camposOpcionales.puesto = datos.puesto;
        if (datos.departamento !== undefined) camposOpcionales.departamento = datos.departamento;
        if (datos.correoPersonal !== undefined) camposOpcionales.correoPersonal = datos.correoPersonal;
        if (datos.backupNombre !== undefined) camposOpcionales.backupNombre = datos.backupNombre;

        const row = await this.prisma.empleado.upsert({
            where: { numeroEmpleado: datos.numeroEmpleado },
            create: {
                numeroEmpleado: datos.numeroEmpleado,
                nombre: datos.nombre,
                primerAcceso: true,
                intentosFallidos: 0,
                recibeNotificacionesMatricial: true,
                ...camposOpcionales,
            },
            update: {
                nombre: datos.nombre,
                ...camposOpcionales,
            },
        });

        return { id: row.id, esNuevo: !existente };
    }

    async actualizarJefes(numeroEmpleado: string, datos: { jefeDirectoId?: string | null; jefeMatricialId?: string | null }): Promise<void> {
        const data: Prisma.EmpleadoUpdateInput = {};
        if (datos.jefeDirectoId !== undefined) {
            data.jefeDirecto = datos.jefeDirectoId ? { connect: { id: datos.jefeDirectoId } } : { disconnect: true };
        }
        if (datos.jefeMatricialId !== undefined) {
            data.jefeMatricial = datos.jefeMatricialId ? { connect: { id: datos.jefeMatricialId } } : { disconnect: true };
        }
        if (Object.keys(data).length === 0) return;

        await this.prisma.empleado.update({
            where: { numeroEmpleado },
            data,
        });
    }

    async actualizarCorreoPorNumeroEmpleado(numeroEmpleado: string, correo: string): Promise<boolean> {
        try {
            await this.prisma.empleado.update({
                where: { numeroEmpleado },
                data: { correoPersonal: correo },
            });
            return true;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return false;
            }
            throw error;
        }
    }

    async actualizarCorreoAutorizacionPorNumeroEmpleado(numeroEmpleado: string, correo: string): Promise<boolean> {
        try {
            await this.prisma.empleado.update({
                where: { numeroEmpleado },
                data: { correoAutorizacion: correo },
            });
            return true;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return false;
            }
            throw error;
        }
    }
}
