import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { TokenActivacion, TokenActivacionRepository } from "../../domain/repositories/TokenActivacionRepository";
import { NotFoundError, ValidationError } from "../../shared/errors";
import { PasswordHasher } from "../ports/PasswordHasher";





export interface CrearPasswordInput {
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
        const tokenActivacion = await this.tokenRepo.buscarPorToken(input.token);
        if(!tokenActivacion){
            throw new ValidationError('Token invalido');
        }

        if(tokenActivacion.usadoAt){
            throw new ValidationError('Este token ya fue utilizado');
        }

        if(tokenActivacion.expiraAt < new Date()){
            throw new ValidationError('El token expiro, solcita uno nuevo');
        }

        if(input.password.length < 8){
            throw new ValidationError('La contraseña debe de tener al menos 8 caracteres')

        }

        const empleado = await this.empleadoRepo.buscarPorId(tokenActivacion.empleadoId);
        if(!empleado){
            throw new NotFoundError('Empleado no encontrado');
        }

        const hash = await this.passwordHasher.hash(input.password);
        empleado.establecerPassword(hash);

        await this.empleadoRepo.guardar(empleado);
        await this.tokenRepo.marcarUsado(tokenActivacion.id);
        


    }
}