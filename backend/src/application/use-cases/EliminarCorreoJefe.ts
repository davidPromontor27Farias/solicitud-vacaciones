import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { NotFoundError } from "../../shared/errors";

export interface EliminarCorreoJefeInput {
    numeroEmpleado: string;
}

export class EliminarCorreoJefe {
    constructor(private empleadoRepo: EmpleadoRepository) {}

    async ejecutar(input: EliminarCorreoJefeInput): Promise<void> {
        const encontrado = await this.empleadoRepo.actualizarCorreoAutorizacionPorNumeroEmpleado(input.numeroEmpleado, null);
        if (!encontrado) {
            throw new NotFoundError('Empleado no encontrado');
        }
    }
}
