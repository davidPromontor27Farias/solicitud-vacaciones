import { Empleado } from "../entities/Empleado";

export interface EmpleadoRepository {
    buscarPorId(id: string): Promise<Empleado | null>;
    buscarPorNumeroEmpleado(numeroEmpleado: string): Promise<Empleado | null>;
    listarEquipoDirecto(jefeDirectoId: string): Promise<Empleado[]>;
    guardar(empleado: Empleado): Promise<void>;
}