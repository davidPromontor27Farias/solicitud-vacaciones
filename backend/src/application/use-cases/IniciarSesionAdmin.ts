
import { Admin } from "../../domain/entities/Admin";
import { AdminRepository } from "../../domain/repositories/AdminRepository";
import { UnauthorizedError } from "../../shared/errors";
import { PasswordHasher } from "../ports/PasswordHasher";



export interface IniciarSesionAdminInput{
    usuario: string;
    password: string;

}

export class IniciarSesionAdmin{
    constructor(
        private adminRepo: AdminRepository,
        private passwordHasher: PasswordHasher
    ) {}

    async ejecutar(input: IniciarSesionAdminInput): Promise<Admin>{
        const admin = await this.adminRepo.buscarPorUsuario(input.usuario);

        if(!admin){
            throw new UnauthorizedError('Credenciales Invalidas');  
        }

        const esValida = await this.passwordHasher.comparar(input.password, admin.passwordHash);

        if(!esValida){
            throw new UnauthorizedError('Credenciales Invalidas');
        }


        return admin;
    }

}

