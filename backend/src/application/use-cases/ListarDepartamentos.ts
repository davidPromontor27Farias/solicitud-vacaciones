import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";




export interface DepartamentoResultado {
    nombre: string;
    totalEmpleados: number;
}

const SIN_DEPARTAMENTO = 'Sin departamento'

export class ListarDepartamentos {
    constructor(private empleadoRepo: EmpleadoRepository){}

    async ejecutar(): Promise<DepartamentoResultado[]>{
        const empleados = await this.empleadoRepo.listarTodos()

        const conteos = new Map<string, number>();
        for (const empleado of empleados){
            const nombre = empleado.departamento?.trim() || SIN_DEPARTAMENTO;
            conteos.set(nombre, (conteos.get(nombre) ?? 0) + 1);
        }
        return [...conteos.entries()]
            .map(([nombre, totalEmpleados]) => ({nombre, totalEmpleados}))
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
}