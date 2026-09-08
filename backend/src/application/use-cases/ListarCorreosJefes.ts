import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";

export interface CorreoJefeResultado {
    empleadoId: string;
    numeroEmpleado: string;
    nombre: string;
    departamento: string | null;
    correoAutorizacion: string | null;
}

export class ListarCorreosJefes {
    constructor(private empleadoRepo: EmpleadoRepository) {}

    async ejecutar(): Promise<CorreoJefeResultado[]> {
        const empleados = await this.empleadoRepo.listarTodos();
        return empleados.map((empleado) => ({
            empleadoId: empleado.id,
            numeroEmpleado: empleado.numeroEmpleado,
            nombre: empleado.nombre,
            departamento: empleado.departamento,
            correoAutorizacion: empleado.correoAutorizacion,
        }));
    }
}
