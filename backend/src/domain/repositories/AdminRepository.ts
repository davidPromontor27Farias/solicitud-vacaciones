import { Admin } from "../entities/Admin";

export interface AdminRepository {
    buscarPorUsuario(usuario: string): Promise<Admin | null>;
    buscarPorId(id: string): Promise<Admin | null>;
}
