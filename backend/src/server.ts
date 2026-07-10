import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './interfaces/http/app';
import { logger } from './shared/logger';

const prisma = new PrismaClient();

async function main() {
    const app = buildApp(prisma);
    const port = Number(process.env.PORT ?? 3000);

    await app.listen({ port, host: '0.0.0.0' });
    logger.info(`Servidor escuchando en el puerto ${port}`);
}

main().catch((error) => {
    logger.error({ err: error }, 'Error al iniciar el servidor');
    process.exit(1);
});