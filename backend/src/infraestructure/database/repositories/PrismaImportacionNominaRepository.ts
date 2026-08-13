import { PrismaClient } from '@prisma/client';
import { DatosImportacionNomina, ImportacionNominaRepository, ImportacionNominaResumen } from '../../../domain/repositories/ImportacionNominaRepository';

export class PrismaImportacionNominaRepository implements ImportacionNominaRepository {
    constructor(private prisma: PrismaClient) {}

    async registrar(datos: DatosImportacionNomina): Promise<void> {
        await this.prisma.importacionNomina.create({
            data: {
                adminId: datos.adminId,
                nombreArchivo: datos.nombreArchivo,
                filasLeidas: datos.filasLeidas,
                empleadosCreados: datos.empleadosCreados,
                empleadosActualizados: datos.empleadosActualizados,
                periodosCreados: datos.periodosCreados,
                periodosActualizados: datos.periodosActualizados,
                periodosEliminados: datos.periodosEliminados,
                jefesNoResueltos: datos.jefesNoResueltos,
            },
        });
    }

    async listar(): Promise<ImportacionNominaResumen[]> {
        const rows = await this.prisma.importacionNomina.findMany({
            include: { admin: { select: { nombre: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return rows.map((r) => ({
            id: r.id,
            adminId: r.adminId,
            adminNombre: r.admin.nombre,
            nombreArchivo: r.nombreArchivo,
            filasLeidas: r.filasLeidas,
            empleadosCreados: r.empleadosCreados,
            empleadosActualizados: r.empleadosActualizados,
            periodosCreados: r.periodosCreados,
            periodosActualizados: r.periodosActualizados,
            periodosEliminados: r.periodosEliminados,
            jefesNoResueltos: r.jefesNoResueltos,
            createdAt: r.createdAt,
        }));
    }
}
