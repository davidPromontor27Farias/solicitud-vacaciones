import {PrismaClient} from "@prisma/client";
import {TransactionManager} from "../../application/ports/TransactionManager";



export class PrismaTransactionManager implements TransactionManager{
    constructor(private prisma: PrismaClient){}

    ejecutar<T>(trabajo: (tx: unknown) => Promise<T>): Promise<T>{
        return this.prisma.$transaction((tx) => trabajo(tx));
    }
}