import {PrismaClient} from "@prisma/client";
import {TransactionManager} from "../../application/ports/TransactionManager";



export class PrismaTransactionManager implements TransactionManager{
    constructor(private prisma: PrismaClient){}

    ejecutar<T>(trabajo: (tx: unknown) => Promise<T>): Promise<T>{
        // Con muchas transacciones concurrentes compitiendo por el pool de conexiones (ej.
        // varios empleados solicitando/aprobando vacaciones casi al mismo tiempo), el default de
        // Prisma (esperar solo 2s para poder arrancar, 5s de limite total) se queda corto y
        // tira "Unable to start a transaction in the given time" aunque cada transaccion en si
        // sea rapida. Se amplia el margen para que la cola se absorba en vez de fallar.
        return this.prisma.$transaction((tx) => trabajo(tx), { maxWait: 10000, timeout: 15000 });
    }
}