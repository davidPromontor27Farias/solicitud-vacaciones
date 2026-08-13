export interface DatosImportacionCorreosJefes {
    adminId: string;
    nombreArchivo: string;
    filasLeidas: number;
    actualizados: number;
    noEncontrados: string[];
}

export interface ImportacionCorreosJefesResumen extends DatosImportacionCorreosJefes {
    id: string;
    adminNombre: string;
    createdAt: Date;
}

export interface ImportacionCorreosJefesRepository {
    registrar(datos: DatosImportacionCorreosJefes): Promise<void>;
    listar(): Promise<ImportacionCorreosJefesResumen[]>;
}
