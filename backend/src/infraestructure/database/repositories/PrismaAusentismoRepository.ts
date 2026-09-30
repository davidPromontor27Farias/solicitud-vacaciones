import {  Prisma, PrismaClient } from "@prisma/client";
import { Ausentismo, EstatusAusentismo, MotivoAusentismo } from "../../../domain/entities/Ausentismo";
import { AusentismoRepository, FiltroAusentismoPorEstatus, FiltroHistorialAusentismo, ResultadoPaginadoAusentismo } from "../../../domain/repositories/AusentismoRepository";


type AusentismoConDias = Prisma.AusentismoGetPayload<{include: {dias: true}}>;

function toDomain(row: AusentismoConDias): Ausentismo{

    return new Ausentismo({
        id: row.id,
        empleadoId: row.empleadoId,
        motivo: row.motivo as MotivoAusentismo,
        comentario: row.comentario,
        dias: row.dias.map((d) => d.fecha),
        estatus: row.estatus as EstatusAusentismo,
        motivoRechazo: row.motivoRechazo,
        createdAt: row.createdAt,
        resueltoAt: row.resueltoAt
    })
}

export class PrismaAusentismoRepository implements AusentismoRepository {
    constructor(private prisma: PrismaClient) {}

    async crear(ausentismo: Ausentismo, tx?: unknown): Promise<void>{
        const cliente = (tx as PrismaClient) ?? this.prisma;
        const props = ausentismo.toProps();
        await cliente.ausentismo.create({
            data: {
                id: props.id,
                empleadoId: props.empleadoId,
                motivo: props.motivo,
                comentario: props.comentario,
                estatus: props.estatus,
                createdAt: props.createdAt,
                dias: {create: props.dias.map((fecha) => ({fecha}))} 
            }
        })
    }

    async buscarPorId(id: string, tx?: unknown): Promise<Ausentismo | null> {
        const cliente = (tx as PrismaClient) ?? this.prisma;
        const row = await cliente.ausentismo.findUnique({where: {id}, include: {dias: true}});
        return row ? toDomain(row) :  null;
    }

    async actualizar(ausentismo: Ausentismo, tx?: unknown): Promise<void>{
        const cliente = (tx as PrismaClient) ?? this.prisma;
        const props = ausentismo.toProps();
        await cliente.ausentismo.update({
            where: {id: props.id},
            data: {
                estatus: props.estatus,
                motivoRechazo: props.motivoRechazo,
                resueltoAt: props.resueltoAt
            }
        })
    }

    async listarPorEmpleado(filtro: FiltroHistorialAusentismo): Promise<ResultadoPaginadoAusentismo<Ausentismo>> {
        const skip = (filtro.pagina - 1) * filtro.porPagina;
        const [rows, total] = await Promise.all([
            this.prisma.ausentismo.findMany({
                where: {empleadoId: filtro.empleadoId},
                include: {dias: {orderBy: {fecha: 'asc'}}},
                orderBy: {createdAt: 'desc'},
                skip, take: filtro.porPagina,
            }),
            this.prisma.ausentismo.count({where: {empleadoId: filtro.empleadoId}}),

        ]);

        return {
            datos: rows.map(toDomain), total, pagina: filtro.pagina, porPagina: filtro.porPagina
        }
    }

    async listarPorEstatus(filtro: FiltroAusentismoPorEstatus): Promise<ResultadoPaginadoAusentismo<Ausentismo>> {
        const skip = (filtro.pagina - 1) * filtro.porPagina;
        const [rows, total] = await Promise.all([
            this.prisma.ausentismo.findMany({
                where: {estatus: filtro.estatus},
                include: {dias: {orderBy: {fecha: 'asc'}}},
                orderBy: {createdAt: 'desc'},
                skip, take: filtro.porPagina
            }),
            this.prisma.ausentismo.count({where: {estatus: filtro.estatus}}),
        ]);
        return {datos: rows.map(toDomain), total, pagina: filtro.pagina, porPagina: filtro.porPagina}
    }

    async listarAprobadosPorEquipo(jefeDirectoId: string, desde: Date, hasta: Date): Promise<Ausentismo[]> {
        const rows = await this.prisma.ausentismo.findMany({
            where: {
                empleado: { jefeDirectoId },
                estatus: 'aprobado',
                dias: { some: { fecha: { gte: desde, lte: hasta } } },
            },
            include: { dias: { orderBy: { fecha: 'asc' } } },
        });
        return rows.map(toDomain);
    }
}