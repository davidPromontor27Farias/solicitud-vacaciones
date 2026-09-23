import { Empleado } from "../entities/Empleado";

export interface DatosEmpleadoImportacion {
    numeroEmpleado: string;
    nombre: string;
    // Campos opcionales: si el import no los trae (undefined), no se tocan en un update.
    // Pasar null los limpia explícitamente.
    sociedad?: string | null;
    puesto?: string | null;
    departamento?: string | null;
    correoPersonal?: string | null;
    backupNombre?: string | null;
}

export interface EmpleadoRepository {
    buscarPorId(id: string): Promise<Empleado | null>;
    // Toma un row lock (SELECT ... FOR UPDATE) sobre el empleado dentro de la transaccion
    // dada. Sirve para serializar operaciones concurrentes que leen y luego escriben saldo
    // del mismo empleado (crear/aprobar/revocar solicitudes): mientras una transaccion tiene
    // el lock, cualquier otra que intente tomarlo para el mismo empleado espera a que la
    // primera termine, evitando que ambas validen contra el mismo saldo desactualizado.
    bloquearParaEscritura(id: string, tx: unknown): Promise<void>;
    buscarPorNumeroEmpleado(numeroEmpleado: string): Promise<Empleado | null>;
    listarEquipoDirecto(jefeDirectoId: string): Promise<Empleado[]>;
    guardar(empleado: Empleado): Promise<void>;
    listarTodos(): Promise<Empleado[]>
    upsertDesdeImportacion(datos: DatosEmpleadoImportacion): Promise<{ id: string; esNuevo: boolean }>;
    // undefined = no tocar ese campo (se dejó sin resolver, se preserva el vínculo previo).
    actualizarJefes(numeroEmpleado: string, datos: { jefeDirectoId?: string | null; jefeMatricialId?: string | null }): Promise<void>;
    actualizarCorreoPorNumeroEmpleado(numeroEmpleado: string, correo: string): Promise<boolean>;
    actualizarCorreoAutorizacionPorNumeroEmpleado(numeroEmpleado: string, correo: string | null): Promise<boolean>;
}
