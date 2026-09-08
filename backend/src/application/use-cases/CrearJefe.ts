import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";

export interface CrearJefeInput {
    numeroEmpleado: string;
    nombre: string;
    departamento: string;
    correo: string;
}

export class CrearJefe {
    constructor(private empleadoRepo: EmpleadoRepository) {}

    async ejecutar(input: CrearJefeInput): Promise<void> {
        await this.empleadoRepo.upsertDesdeImportacion({
            numeroEmpleado: input.numeroEmpleado,
            nombre: input.nombre,
            departamento: input.departamento,
        });
        await this.empleadoRepo.actualizarCorreoAutorizacionPorNumeroEmpleado(input.numeroEmpleado, input.correo);
    }
}
