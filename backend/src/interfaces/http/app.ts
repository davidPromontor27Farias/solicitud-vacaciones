import helmet from '@fastify/helmet';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { ZodError } from 'zod';
import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '../../shared/logger';
import { AppError } from '../../shared/errors';
import { registerAuthRoutes } from './routes/auth.routes';
import { PrismaEmpleadoRepository } from '../../infraestructure/database/repositories/PrismaEmpleadoRepository';
import { PrismaTokenActivacionRepository } from '../../infraestructure/database/repositories/PrismaTokenActivacionRepository';
import { BcryptPasswordHasher } from '../../infraestructure/auth/BcryptPasswordHasher';
import { CryptoIdGenerator } from '../../infraestructure/auth/CryptoIdGenerator';
import { JwtEnlaceRevisionGenerator } from '../../infraestructure/auth/JwtEnlaceRevisionGenerator';
import { DirectEmailNotifier } from '../../infraestructure/email/DirectEmailNotifier';
import { registerSolicitudesRoutes } from './routes/solicitudes.routes';
import { registerEmpleadosRoutes } from './routes/empleados.routes';
import { registerRevisionRoutes } from './routes/revision.routes';
import { PrismaSaldoVacacionesRepository } from '../../infraestructure/database/repositories/PrismaSaldoVacacionesRepository';
import { PrismaSolicitudVacacionesRepository } from '../../infraestructure/database/repositories/PrismaSolicitudVacacionesRepository';
import { PrismaAdminRepository } from '../../infraestructure/database/repositories/PrismaAdminRepository';
import { PrismaImportacionNominaRepository } from '../../infraestructure/database/repositories/PrismaImportacionNominaRepository';
import { PrismaImportacionCorreosJefesRepository } from '../../infraestructure/database/repositories/PrismaImportacionCorreosJefesRepository';
import { registerAdminRoutes } from './routes/admin.routes';
import { registerJefeRoutes } from './routes/jefe.routes';
import { PrismaTransactionManager } from '../../infraestructure/database/PrismaTransactionManager';

export function buildApp(prisma: PrismaClient): FastifyInstance {
    const app = Fastify({ logger: false, maxParamLength: 1000, trustProxy: true });

    // CORS_ORIGINS: lista adicional de origenes separados por coma (ej. el dominio de
    // Vercel del frontend), para cuando el frontend no se sirve desde el mismo origen
    // que este backend (APP_URL sigue usandose ademas para los enlaces de los correos).
    const origenesAdicionales = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter((o) => o.length > 0);

    const origenesPermitidos = [process.env.APP_URL, 'http://localhost:5173', ...origenesAdicionales].filter(
        (o): o is string => Boolean(o),
    )

    app.register(helmet, {contentSecurityPolicy: false});
    app.register(cors, {
        origin(origin, callback){
            const esProduccion = process.env.NODE_ENV === 'production';
            if(!origin || !esProduccion || origenesPermitidos.includes(origin)){
                callback(null, true);
                return;
            }
            callback(new Error('origen no permitido'), false);
        },
        // Por defecto @fastify/cors solo permite GET,HEAD,POST. La API tambien usa
        // PUT y DELETE (ej. editar/eliminar correos de jefes), asi que hay que
        // declararlos explicitamente o el navegador los bloquea en el preflight.
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
    })

    app.register(jwt, {secret: process.env.JWT_SECRET!});
    app.register(rateLimit, {max: 100, timeWindow: '1 minute'});
    app.register(multipart, {limits: {fileSize: 5 * 1024 * 1024}});

    app.setErrorHandler((error, _request, reply) => {
        if (error instanceof AppError) {
            reply.status(error.statusCode).send({ error: error.message });
            return;
        }
        if (error instanceof ZodError) {
            reply.status(400).send({ error: 'Datos inválidos', detalles: error.issues });
            return;
        }
        logger.error({ err: error }, 'Error no controlado');
        reply.status(500).send({ error: 'Error interno del servidor' });
    });

    app.get('/health', async () => ({ status: 'ok' }));

    const empleadoRepo = new PrismaEmpleadoRepository(prisma);
    const adminRepo = new PrismaAdminRepository(prisma);
    const saldoRepo = new PrismaSaldoVacacionesRepository(prisma);
    const solicitudRepo = new PrismaSolicitudVacacionesRepository(prisma);
    const importacionNominaRepo = new PrismaImportacionNominaRepository(prisma);
    const importacionCorreosRepo = new PrismaImportacionCorreosJefesRepository(prisma);
    const tokenRepo = new PrismaTokenActivacionRepository(prisma);
    const passwordHasher = new BcryptPasswordHasher();
    const idGenerator = new CryptoIdGenerator();
    const emailNotifier = new DirectEmailNotifier(prisma);
    const enlaceGenerator = new JwtEnlaceRevisionGenerator(process.env.JWT_SECRET!);
    const txManager = new PrismaTransactionManager(prisma);

    app.register(async (api) => {
        registerAuthRoutes(api, { empleadoRepo, tokenRepo, passwordHasher, idGenerator, emailNotifier });
        registerSolicitudesRoutes(api, { empleadoRepo, saldoRepo, solicitudRepo, emailNotifier, idGenerator, enlaceGenerator, txManager });
        registerEmpleadosRoutes(api, { empleadoRepo, saldoRepo, solicitudRepo });
        registerRevisionRoutes(api, { empleadoRepo, saldoRepo, solicitudRepo, emailNotifier, enlaceGenerator, txManager });
        registerAdminRoutes(api, {adminRepo, empleadoRepo, saldoRepo, solicitudRepo, importacionNominaRepo, importacionCorreosRepo, passwordHasher, idGenerator})
        registerJefeRoutes(api, { empleadoRepo, saldoRepo, solicitudRepo, enlaceGenerator, emailNotifier, txManager });
    }, { prefix: '/api' });

    return app;
}