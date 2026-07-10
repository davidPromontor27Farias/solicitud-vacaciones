import { PrismaClient } from "@prisma/client";
import { EmailNotifier } from "../../application/ports/EmailNotifier";
import { emailQueue } from "./EmailQueue";




export class BullMQEmailNotifier implements EmailNotifier{
    
    constructor(private prisma: PrismaClient){}

    async encolar(params: {
        tipo: string;
        destinatario: string;
        solicitudId?: string;
        datos: Record<string, string>;
    }): Promise<void>{
        const notificacion = await this.prisma.notificacionEmail.create({
            data: {
                tipo: params.tipo as any,
                destinatario: params.destinatario,
                solicitudId: params.solicitudId ?? null
            }
        });

        await emailQueue.add('enviar-email', {
            notificacionId: notificacion.id,
            tipo: params.tipo,
            destinatario: params.destinatario,
            datos: params.datos
        })
    }
}