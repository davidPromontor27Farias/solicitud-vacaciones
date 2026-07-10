import { PrismaClient } from "@prisma/client";
import { TokenActivacion, TokenActivacionRepository } from "../../../domain/repositories/TokenActivacionRepository";


export class PrismaTokenActivacionRepository implements TokenActivacionRepository{
    constructor(private prisma: PrismaClient){}

    async crear(token: Omit<TokenActivacion, 'id'>): Promise<TokenActivacion>{
        return this.prisma.tokenActivacion.create({data: token});
    }

    async buscarPorToken(token: string): Promise<TokenActivacion | null> {
        return this.prisma.tokenActivacion.findUnique({where: {token}});
    }

    async marcarUsado(id: string): Promise<void> {
        await this.prisma.tokenActivacion.update({where: {id}, data: {usadoAt: new Date()}});
    }
}