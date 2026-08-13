export interface DatosImportacionNomina {
    adminId: string;
    nombreArchivo: string;
    filasLeidas: number;
    empleadosCreados: number;
    empleadosActualizados: number;
    periodosCreados: number;
    periodosActualizados: number;
    periodosEliminados: number;
    jefesNoResueltos: string[];
}

export interface ImportacionNominaResumen extends DatosImportacionNomina {
    id: string;
    adminNombre: string;
    createdAt: Date;
}

export interface ImportacionNominaRepository {
    registrar(datos: DatosImportacionNomina): Promise<void>;
    listar(): Promise<ImportacionNominaResumen[]>;
}
