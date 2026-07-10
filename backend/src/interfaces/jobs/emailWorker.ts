import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { Worker, Job } from "bullmq";
import { EMAIL_QUEUE_NAME } from "../../infraestructure/email/EmailQueue";
import { redis } from "../../infraestructure/cache/redisClient";
import { logger } from "../../shared/logger";
import { mailer } from '../../infraestructure/email/mailer';
import { construirCorreo } from '../../infraestructure/email/plantillas';


const prisma = new PrismaClient();

interface EmailJobData{
    notificacionId: string;
    tipo: string;
    destinatario: string;
    datos: Record<string, string>
}

export const emailWorker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
        const { notificacionId, tipo, destinatario, datos } = job.data;
        const { subject, text, html } = construirCorreo(tipo, datos);

        try {
            await mailer.sendMail({ from: process.env.SMTP_FROM, to: destinatario, subject, text, html });
            await prisma.notificacionEmail.update({
                where: { id: notificacionId },
                data: { estatusEnvio: 'enviado', enviadoAt: new Date(), intentos: { increment: 1 } },
            });
        } catch (error) {
                await prisma.notificacionEmail.update({
                where: { id: notificacionId },
                data: { estatusEnvio: 'fallido', intentos: { increment: 1 } },
            });
            logger.error({ err: error, notificacionId }, 'Fallo al enviar email');
            throw error;
        }
    },
    { connection: redis },
);

emailWorker.on('completed', (job) => logger.info({ jobId: job.id }, 'Email enviado'));
emailWorker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Job de email fallido'));