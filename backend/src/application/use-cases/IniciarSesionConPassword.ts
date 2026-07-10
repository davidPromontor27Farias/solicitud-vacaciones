import { Empleado } from "../../domain/entities/Empleado";
import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { PasswordHasher } from "../ports/PasswordHasher";
import { UnauthorizedError } from "../../shared/errors";


export interface IniciarSesionInput {
    numeroEmpleado: string;
    password: string;
}

export class IniciarSesionConPassword{
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private passwordHasher: PasswordHasher,
    ) {}

    async ejecutar(input: IniciarSesionInput): Promise<Empleado>{
        const empleado = await this.empleadoRepo.buscarPorNumeroEmpleado(input.numeroEmpleado);
        if(!empleado || !empleado.passwordHash){
            throw new UnauthorizedError('Credenciales invalidas')
        }
        if(empleado.estaBloqueado()){
            throw new UnauthorizedError('Cuenta bloqueada temporalmente por intentos fallidos, intenta mas tarde');
        }

        const esValida = await this.passwordHasher.comparar(input.password, empleado.passwordHash);
        if(!esValida){
            empleado.registrarIntentoFallido();
            await this.empleadoRepo.guardar(empleado);
            throw new UnauthorizedError('Credenciales invalidas');
        }

        empleado.reiniciarIntentosFallidos();
        await this.empleadoRepo.guardar(empleado);
        return empleado;
    }
}