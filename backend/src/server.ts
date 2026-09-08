import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './interfaces/http/app';
import { logger } from './shared/logger';

const prisma = new PrismaClient();

process.on('unhandledRejection', (error) => {
    logger.error({ err: error }, 'Promesa rechazada sin manejar');
});

process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Excepción no capturada, cerrando el proceso');
    process.exit(1);
});

async function main() {
    const app = buildApp(prisma);
    const port = Number(process.env.PORT ?? 3000);

    await app.listen({ port, host: '0.0.0.0' });
    logger.info(`Servidor escuchando en el puerto ${port}`);

    const apagar = async (señal: string) => {
        logger.info(`${señal} recibido, cerrando servidor...`);
        await app.close();
        await prisma.$disconnect();
        process.exit(0);
    };
    process.on('SIGTERM', () => { void apagar('SIGTERM'); });
    process.on('SIGINT', () => { void apagar('SIGINT'); });
}

main().catch((error) => {
    logger.error({ err: error }, 'Error al iniciar el servidor');
    process.exit(1);
});