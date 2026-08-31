import { PrismaClient } from "@prisma/client";
import { SolicitudVacaciones, SolicitudVacacionesProps } from "../../../domain/entities/SolicitudVacaciones";
import { FiltroHistorial, FiltroPorEstatus, ResultadoPaginado, SolicitudVacacionesRepository} from '../../../domain/repositories/SolicitudVacacionesRepository'; 



type SolicitudConDias = {
    id: string;
    empleadoId: string;
    estatus: SolicitudVacacionesProps["estatus"];
    backupNombre: string | null;
    motivoRevocacion: string | null;
    motivoRechazo: string | null;
    revocadoPorId: string | null;
    createdAt: Date;
    resueltoAt: Date | null;
    diasSolicitados: {fecha: Date}[];
}

function toDomain(row: SolicitudConDias): SolicitudVacaciones{
    return new SolicitudVacaciones({
        id: row.id,
        empleadoId: row.empleadoId,
        estatus: row.estatus,
        dias: row.diasSolicitados.map(d => d.fecha),
        backupNombre: row.backupNombre,
        motivoRevocacion: row.motivoRevocacion,
        motivoRechazo: row.motivoRechazo,
        revocadoPorId: row.revocadoPorId,
        createdAt: row.createdAt,
        resueltoAt: row.resueltoAt
    })
}

export class PrismaSolicitudVacacionesRepository implements SolicitudVacacionesRepository{

    constructor(private prisma: PrismaClient){}

    async crear(solicitud: SolicitudVacaciones): Promise<void>{
        const props = solicitud.toProps();
        await this.prisma.solicitudVacaciones.create({
            data:{
                id: props.id,
                empleadoId: props.empleadoId,
                estatus: props.estatus,
                backupNombre: props.backupNombre ?? null,
                diasSolicitados: {
                    create: props.dias.map((fecha) => ({fecha}))
                }
            }
        })
    }

    async buscarPorId(id: string): Promise<SolicitudVacaciones | null> {
        const row = await this.prisma.solicitudVacaciones.findUnique({
            where: {id},
            include: {diasSolicitados: {orderBy: {fecha: 'asc'}}},
        });
        return row ? toDomain(row) : null;
    }

    async actualizar(solicitud: SolicitudVacaciones): Promise<void> {
        const props = solicitud.toProps();
        await this.prisma.solicitudVacaciones.update({
            where: {id: props.id},
            data: {
                estatus: props.estatus,
                backupNombre: props.backupNombre ?? null,
                motivoRevocacion: props.motivoRevocacion ?? null,
                motivoRechazo: props.motivoRechazo ?? null,
                revocadoPorId: props.revocadoPorId ?? null,
                resueltoAt: props.resueltoAt
            }
        })
    }

    async listarPorEmpleado(filtro: FiltroHistorial): Promise<ResultadoPaginado<SolicitudVacaciones>>{
        const skip = (filtro.pagina - 1) * filtro.porPagina;
        const [rows, total] = await Promise.all([
            this.prisma.solicitudVacaciones.findMany({
                where: {empleadoId: filtro.empleadoId},
                include: {diasSolicitados: {orderBy: {fecha: 'asc'}}},
                orderBy: {createdAt: 'desc'},
                skip,
                take: filtro.porPagina
            }),
            this.prisma.solicitudVacaciones.count({where: {empleadoId: filtro.empleadoId}}),
        ]);

        return {
            datos: rows.map(toDomain),
            total, 
            pagina: filtro.pagina,
            porPagina: filtro.porPagina
        }
    }

    async listarAprobadasPorEmpleado(empleadoId: string): Promise<SolicitudVacaciones[]> {
        const rows = await this.prisma.solicitudVacaciones.findMany({
            where: { empleadoId, estatus: 'aprobada' },
            include: { diasSolicitados: { orderBy: { fecha: 'asc' } } },
        });
        return rows.map(toDomain);
    }

    async listarPorEquipo(jefeDirectoId: string, desde: Date, hasta: Date): Promise<SolicitudVacaciones[]> {
        const rows = await this.prisma.solicitudVacaciones.findMany({
            where: {
                empleado: {jefeDirectoId},
                diasSolicitados: {some: {fecha: {gte: desde, lte: hasta}}},
            },
            include: {diasSolicitados: {orderBy: {fecha: 'asc'}}},
        });
        return rows.map(toDomain)
    }

    async listarPorEstatus(filtro: FiltroPorEstatus): Promise<ResultadoPaginado<SolicitudVacaciones>> {
        const skip = (filtro.pagina - 1) * filtro.porPagina;
        const [rows, total] = await Promise.all([
            this.prisma.solicitudVacaciones.findMany({
                where: {estatus: filtro.estatus},
                include: {diasSolicitados: {orderBy: {fecha: 'asc'}}},
                orderBy: {createdAt: 'desc'},
                skip,
                take: filtro.porPagina,
            }),
            this.prisma.solicitudVacaciones.count({where: {estatus: filtro.estatus}}),
        ]);

        return {
            datos: rows.map(toDomain),
            total,
            pagina: filtro.pagina,
            porPagina: filtro.porPagina,
        };
    }
}