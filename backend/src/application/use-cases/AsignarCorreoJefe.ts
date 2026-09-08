import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { NotFoundError } from "../../shared/errors";

export interface AsignarCorreoJefeInput {
    numeroEmpleado: string;
    correo: string;
}

export class AsignarCorreoJefe {
    constructor(private empleadoRepo: EmpleadoRepository) {}

    async ejecutar(input: AsignarCorreoJefeInput): Promise<void> {
        const encontrado = await this.empleadoRepo.actualizarCorreoAutorizacionPorNumeroEmpleado(input.numeroEmpleado, input.correo);
        if (!encontrado) {
            throw new NotFoundError('Empleado no encontrado');
        }
    }
}
