import { PrismaClient } from "@prisma/client";
import { Admin, AdminProps } from "../../../domain/entities/Admin";
import { AdminRepository } from "../../../domain/repositories/AdminRepository";



function toDomain(row: AdminProps): Admin{
    return new Admin(row);
}

export class PrismaAdminRepository implements AdminRepository{
    constructor(private prisma: PrismaClient) {}

    async buscarPorUsuario(usuario: string): Promise<Admin | null> {
        const row = await this.prisma.admin.findUnique({where: {usuario}});
        return row ? toDomain(row) : null;
    }

    async buscarPorId(id: string): Promise<Admin | null> {
        const row = await this.prisma.admin.findUnique({where: {id}});
        return row ? toDomain(row) : null;
    }
}