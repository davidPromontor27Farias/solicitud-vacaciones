import { ImportacionNominaRepository } from '../../domain/repositories/ImportacionNominaRepository';
import { ImportacionCorreosJefesRepository } from '../../domain/repositories/ImportacionCorreosJefesRepository';

export interface HistorialCargaItem {
    id: string;
    tipo: 'correos_jefes' | 'reporte_vacaciones';
    nombreArchivo: string;
    adminNombre: string;
    createdAt: Date;
    filasLeidas: number;
    resumen: Record<string, number>;
    avisos: string[];
}

export class ListarHistorialCargas {
    constructor(
        private importacionNominaRepo: ImportacionNominaRepository,
        private importacionCorreosRepo: ImportacionCorreosJefesRepository,
    ) {}

    async ejecutar(): Promise<HistorialCargaItem[]> {
        const [reportes, correos] = await Promise.all([
            this.importacionNominaRepo.listar(),
            this.importacionCorreosRepo.listar(),
        ]);

        const itemsReportes: HistorialCargaItem[] = reportes.map((r) => ({
            id: r.id,
            tipo: 'reporte_vacaciones',
            nombreArchivo: r.nombreArchivo,
            adminNombre: r.adminNombre,
            createdAt: r.createdAt,
            filasLeidas: r.filasLeidas,
            resumen: {
                'Empleados nuevos': r.empleadosCreados,
                'Empleados actualizados': r.empleadosActualizados,
                'Periodos nuevos': r.periodosCreados,
                'Periodos actualizados': r.periodosActualizados,
                'Periodos eliminados': r.periodosEliminados,
            },
            avisos: r.jefesNoResueltos.map((j) => `Jefe no encontrado: ${j}`),
        }));

        const itemsCorreos: HistorialCargaItem[] = correos.map((c) => ({
            id: c.id,
            tipo: 'correos_jefes',
            nombreArchivo: c.nombreArchivo,
            adminNombre: c.adminNombre,
            createdAt: c.createdAt,
            filasLeidas: c.filasLeidas,
            resumen: {
                'Correos actualizados': c.actualizados,
            },
            avisos: c.noEncontrados.map((n) => `No encontrado: ${n}`),
        }));

        return [...itemsReportes, ...itemsCorreos].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
}
