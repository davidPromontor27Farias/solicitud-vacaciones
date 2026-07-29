import { Empleado } from "../entities/Empleado";

export interface DatosEmpleadoImportacion {
    numeroEmpleado: string;
    nombre: string;
    sociedad: string | null;
    puesto: string | null;
    departamento: string | null;
    correoPersonal: string | null;
}

export interface EmpleadoRepository {
    buscarPorId(id: string): Promise<Empleado | null>;
    buscarPorNumeroEmpleado(numeroEmpleado: string): Promise<Empleado | null>;
    listarEquipoDirecto(jefeDirectoId: string): Promise<Empleado[]>;
    guardar(empleado: Empleado): Promise<void>;
    listarTodos(): Promise<Empleado[]>
    upsertDesdeImportacion(datos: DatosEmpleadoImportacion): Promise<{ id: string; esNuevo: boolean }>;
    actualizarJefes(numeroEmpleado: string, jefeDirectoId: string | null, jefeMatricialId: string | null): Promise<void>;
}
