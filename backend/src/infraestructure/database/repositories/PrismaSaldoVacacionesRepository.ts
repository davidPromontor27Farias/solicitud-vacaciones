import { PrismaClient } from "@prisma/client";
import { SaldoVacacionesRepository } from "../../../domain/repositories/SaldoVacacionesRepository";
import { SaldoVacaciones } from "../../../domain/entities/SaldoVacaciones";

function toDomain(row: {
    id: string;
    empleadoId: string;
    diasPorLey: number;
    diasDisfrutados: number;
    diasPendientes: number;
    inicioValidez: Date;
    fechaVencimiento: Date;
}): SaldoVacaciones {
    return new SaldoVacaciones({
        id: row.id,
        empleadoId: row.empleadoId,
        diasPorLey: row.diasPorLey,
        diasDisfrutados: row.diasDisfrutados,
        diasPendientes: row.diasPendientes,
        inicioValidez: row.inicioValidez,
        fechaVencimiento: row.fechaVencimiento,
    });
}

export class PrismaSaldoVacacionesRepository implements SaldoVacacionesRepository {
    constructor(private prisma: PrismaClient) {}

    async listarPorEmpleadoId(empleadoId: string): Promise<SaldoVacaciones[]> {
        const rows = await this.prisma.saldoVacaciones.findMany({ where: { empleadoId } });
        return rows.map(toDomain);
    }

    async crear(saldo: SaldoVacaciones): Promise<void> {
        const props = saldo.toProps();
        await this.prisma.saldoVacaciones.create({
            data: {
                id: props.id,
                empleadoId: props.empleadoId,
                diasPorLey: props.diasPorLey,
                diasDisfrutados: props.diasDisfrutados,
                diasPendientes: props.diasPendientes,
                inicioValidez: props.inicioValidez,
                fechaVencimiento: props.fechaVencimiento,
            },
        });
    }

    async guardar(saldo: SaldoVacaciones): Promise<void> {
        const props = saldo.toProps();
        await this.prisma.saldoVacaciones.update({
            where: { id: props.id },
            data: {
                diasDisfrutados: props.diasDisfrutados,
                diasPendientes: props.diasPendientes,
            },
        });
    }
}
