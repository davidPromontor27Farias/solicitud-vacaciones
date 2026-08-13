import { PrismaClient } from "@prisma/client";
import { EmailNotifier } from "../../application/ports/EmailNotifier";
import { logger } from "../../shared/logger";
import { enviarCorreo } from "./mailer";
import { construirCorreo } from "./plantillas";

export class DirectEmailNotifier implements EmailNotifier {

    constructor(private prisma: PrismaClient) {}

    async encolar(params: {
        tipo: string;
        destinatario: string;
        solicitudId?: string;
        datos: Record<string, string>;
    }): Promise<void> {
        const notificacion = await this.prisma.notificacionEmail.create({
            data: {
                tipo: params.tipo as any,
                destinatario: params.destinatario,
                solicitudId: params.solicitudId ?? null
            }
        });

        const { subject, text, html, attachments } = construirCorreo(params.tipo, params.datos);

        try {
            await enviarCorreo({ from: process.env.EMAIL_FROM!, to: params.destinatario, subject, text, html, attachments });
            await this.prisma.notificacionEmail.update({
                where: { id: notificacion.id },
                data: { estatusEnvio: 'enviado', enviadoAt: new Date(), intentos: { increment: 1 } },
            });
        } catch (error) {
            await this.prisma.notificacionEmail.update({
                where: { id: notificacion.id },
                data: { estatusEnvio: 'fallido', intentos: { increment: 1 } },
            });
            logger.error({ err: error, notificacionId: notificacion.id }, 'Fallo al enviar email');
        }
    }
}
