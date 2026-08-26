import path from 'node:path';
import { existsSync } from 'node:fs';
import helmet from '@fastify/helmet';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
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
import { PrismaPlanificacionVacacionesRepository } from '../../infraestructure/database/repositories/PrismaPlanificacionVacacionesRepository';
import { registerAdminRoutes } from './routes/admin.routes';
import { registerJefeRoutes } from './routes/jefe.routes';

export function buildApp(prisma: PrismaClient): FastifyInstance {
    const app = Fastify({ logger: false, maxParamLength: 1000 });

    const origenesPermitidos = [process.env.APP_URL, 'http://localhost:5173'].filter(
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
        }
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
    const planificacionRepo = new PrismaPlanificacionVacacionesRepository(prisma);
    const tokenRepo = new PrismaTokenActivacionRepository(prisma);
    const passwordHasher = new BcryptPasswordHasher();
    const idGenerator = new CryptoIdGenerator();
    const emailNotifier = new DirectEmailNotifier(prisma);
    const enlaceGenerator = new JwtEnlaceRevisionGenerator(process.env.JWT_SECRET!);

    app.register(async (api) => {
        registerAuthRoutes(api, { empleadoRepo, tokenRepo, passwordHasher, idGenerator, emailNotifier });
        registerSolicitudesRoutes(api, { empleadoRepo, saldoRepo, solicitudRepo, emailNotifier, idGenerator, enlaceGenerator });
        registerEmpleadosRoutes(api, { empleadoRepo, saldoRepo });
        registerRevisionRoutes(api, { empleadoRepo, saldoRepo, solicitudRepo, emailNotifier, enlaceGenerator });
        registerAdminRoutes(api, {adminRepo, empleadoRepo, saldoRepo, solicitudRepo, importacionNominaRepo, importacionCorreosRepo, passwordHasher, idGenerator})
        registerJefeRoutes(api, { empleadoRepo, saldoRepo, planificacionRepo, idGenerator });
    }, { prefix: '/api' });

    // En producción, la imagen de Docker copia el build del frontend a ./public
    // (hermano de dist/). En desarrollo esa carpeta no existe: el frontend se
    // sirve aparte con Vite, así que el estático se omite y no rompe el arranque.
    const carpetaFrontend = path.join(__dirname, '../../../public');
    if (existsSync(carpetaFrontend)) {
        app.register(fastifyStatic, {
            root: carpetaFrontend,
            wildcard: false,
        });

        app.setNotFoundHandler((request, reply) => {
            if (request.method !== 'GET' || request.url.startsWith('/api/')) {
                reply.status(404).send({ error: 'No encontrado' });
                return;
            }
            reply.sendFile('index.html');
        });
    }

    return app;
}