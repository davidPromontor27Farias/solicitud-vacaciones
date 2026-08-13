import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { TokenActivacionRepository } from "../../domain/repositories/TokenActivacionRepository";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors";
import { PasswordHasher } from "../ports/PasswordHasher";

export interface CrearPasswordInput {
    numeroEmpleado: string;
    token: string;
    password: string;
}

export class CrearPassword {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private tokenRepo: TokenActivacionRepository,
        private passwordHasher: PasswordHasher,
    ){}


    async ejecutar(input: CrearPasswordInput): Promise<void>{
        const empleado = await this.empleadoRepo.buscarPorNumeroEmpleado(input.numeroEmpleado);
        if(!empleado){
            throw new NotFoundError('Empleado no encontrado');
        }

        // Mismo bloqueo por intentos fallidos que el login: un código de 6 dígitos es
        // adivinable si no se limita cuántas veces se puede intentar por cuenta.
        if(empleado.estaBloqueado()){
            throw new UnauthorizedError('Cuenta bloqueada temporalmente por intentos fallidos, intenta mas tarde');
        }

        const tokenActivacion = await this.tokenRepo.buscarPorToken(input.token);
        const tokenValido = tokenActivacion
            && tokenActivacion.empleadoId === empleado.id
            && !tokenActivacion.usadoAt
            && tokenActivacion.expiraAt >= new Date();

        if(!tokenValido){
            empleado.registrarIntentoFallido();
            await this.empleadoRepo.guardar(empleado);
            throw new ValidationError('Código inválido o expirado');
        }

        if(input.password.length < 8){
            throw new ValidationError('La contraseña debe de tener al menos 8 caracteres')
        }

        const hash = await this.passwordHasher.hash(input.password);
        empleado.establecerPassword(hash);
        empleado.reiniciarIntentosFallidos();

        await this.empleadoRepo.guardar(empleado);
        await this.tokenRepo.marcarUsado(tokenActivacion.id);
    }
}
