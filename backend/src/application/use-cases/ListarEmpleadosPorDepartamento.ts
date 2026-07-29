import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";


export interface EmpleadoDepartamentoResultado {
    numeroEmpleado: string;
    nombre: string;
    puesto: string | null;
    jefeDirecto: {nombre: string} | null;
    totalPendientes: number;
    totalDisfrutados: number;
}

const SIN_DEPARTAMENTO = 'Sin departamento';


export class ListarEmpleadosPorDepartamento{
    constructor(
        private empleadoRepo: EmpleadoRepository, 
        private saldoRepo: SaldoVacacionesRepository
    ){}

    async ejecutar(input: {departamento: string}): Promise<EmpleadoDepartamentoResultado[]>{
        const todos = await this.empleadoRepo.listarTodos();
        const delDepartamento = todos.filter((empleado) => {
            const nombre = empleado.departamento?.trim() || SIN_DEPARTAMENTO;
            return nombre === input.departamento;
        });

        const resultado: EmpleadoDepartamentoResultado[] = [];
        for(const empleado of delDepartamento){
            let jefeDirecto: {nombre: string} | null = null;
            if(empleado.jefeDirectoId){
                const jefe = await this.empleadoRepo.buscarPorId(empleado.jefeDirectoId);
                jefeDirecto = jefe ? {nombre: jefe.nombre} : null;
            }

            const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id);
            resultado.push({
                numeroEmpleado: empleado.numeroEmpleado,
                nombre: empleado.nombre,
                puesto: empleado.puesto,
                jefeDirecto,
                totalPendientes: saldos.reduce((acc, s) => acc + s.diasPendientes, 0),
                totalDisfrutados: saldos.reduce((acc, s) => acc + s.diasDisfrutados, 0)
            })
        }

        return resultado;
    }



}