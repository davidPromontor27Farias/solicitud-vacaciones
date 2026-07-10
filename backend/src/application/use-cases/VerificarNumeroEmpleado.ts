import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";

export interface VerificarNumeroEmpleadoResultado {
    existe: boolean;
    requierePrimerAcceso: boolean;
}

export class VerificarNumeroEmpleado {
    constructor(private empleadoRepo: EmpleadoRepository){}

    async ejecutar(numeroEmpleado: string): Promise<VerificarNumeroEmpleadoResultado>{
        const empleado = await this.empleadoRepo.buscarPorNumeroEmpleado(numeroEmpleado);
        if(!empleado){
            return{
                existe: false, requierePrimerAcceso: false
            };
        }
        return {existe: true, requierePrimerAcceso: empleado.primerAcceso}
    }
}