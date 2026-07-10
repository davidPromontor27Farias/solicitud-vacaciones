import path from 'node:path';
import { existsSync } from 'node:fs';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { ZodError } from 'zod';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/logger';
import { AppError } from '../../shared/errors';
import { registerAuthRoutes } from './routes/auth.routes';
import { PrismaEmpleadoRepository } from '../../infraestructure/database/repositories/PrismaEmpleadoRepository';
import { PrismaTokenActivacionRepository } from '../../infraestructure/database/repositories/PrismaTokenActivacionRepository';
import { BcryptPasswordHasher } from '../../infraestructure/auth/BcryptPasswordHasher';
import { CryptoIdGenerator } from '../../infraestructure/auth/CryptoIdGenerator';
import { JwtEnlaceRevisionGenerator } from '../../infraestructure/auth/JwtEnlaceRevisionGenerator';
import { BullMQEmailNotifier } from '../../infraestructure/email/BullMQEmailNotifier';
import { registerSolicitudesRoutes } from './routes/solicitudes.routes';
import { registerEmpleadosRoutes } from './routes/empleados.routes';
import { registerRevisionRoutes } from './routes/revision.routes';
import { PrismaSaldoVacacionesRepository } from '../../infraestructure/database/repositories/PrismaSaldoVacacionesRepository';
import { PrismaSolicitudVacacionesRepository } from '../../infraestructure/database/repositories/PrismaSolicitudVacacionesRepository';

export function buildApp(prisma: PrismaClient): FastifyInstance {
    const app = Fastify({ logger: false, maxParamLength: 1000 });

    app.register(cors, { origin: true });
    app.register(jwt, { secret: process.env.JWT_SECRET! });
    app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

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
    const saldoRepo = new PrismaSaldoVacacionesRepository(prisma);
    const solicitudRepo = new PrismaSolicitudVacacionesRepository(prisma);
    const tokenRepo = new PrismaTokenActivacionRepository(prisma);
    const passwordHasher = new BcryptPasswordHasher();
    const idGenerator = new CryptoIdGenerator();
    const emailNotifier = new BullMQEmailNotifier(prisma);
    const enlaceGenerator = new JwtEnlaceRevisionGenerator(process.env.JWT_SECRET!);

    app.register(async (api) => {
        registerAuthRoutes(api, { empleadoRepo, tokenRepo, passwordHasher, idGenerator, emailNotifier });
        registerSolicitudesRoutes(api, { empleadoRepo, saldoRepo, solicitudRepo, emailNotifier, idGenerator, enlaceGenerator });
        registerEmpleadosRoutes(api, { empleadoRepo, saldoRepo });
        registerRevisionRoutes(api, { empleadoRepo, saldoRepo, solicitudRepo, emailNotifier, enlaceGenerator });
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