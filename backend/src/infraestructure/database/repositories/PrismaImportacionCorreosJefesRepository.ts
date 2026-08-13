import { PrismaClient } from '@prisma/client';
import { DatosImportacionCorreosJefes, ImportacionCorreosJefesRepository, ImportacionCorreosJefesResumen } from '../../../domain/repositories/ImportacionCorreosJefesRepository';

export class PrismaImportacionCorreosJefesRepository implements ImportacionCorreosJefesRepository {
    constructor(private prisma: PrismaClient) {}

    async registrar(datos: DatosImportacionCorreosJefes): Promise<void> {
        await this.prisma.importacionCorreosJefes.create({
            data: {
                adminId: datos.adminId,
                nombreArchivo: datos.nombreArchivo,
                filasLeidas: datos.filasLeidas,
                actualizados: datos.actualizados,
                noEncontrados: datos.noEncontrados,
            },
        });
    }

    async listar(): Promise<ImportacionCorreosJefesResumen[]> {
        const rows = await this.prisma.importacionCorreosJefes.findMany({
            include: { admin: { select: { nombre: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return rows.map((r) => ({
            id: r.id,
            adminId: r.adminId,
            adminNombre: r.admin.nombre,
            nombreArchivo: r.nombreArchivo,
            filasLeidas: r.filasLeidas,
            actualizados: r.actualizados,
            noEncontrados: r.noEncontrados,
            createdAt: r.createdAt,
        }));
    }
}
