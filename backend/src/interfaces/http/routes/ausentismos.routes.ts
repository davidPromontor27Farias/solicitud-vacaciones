import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/authenticate';
import { EmpleadoRepository } from '../../../domain/repositories/EmpleadoRepository';
import { AusentismoRepository } from '../../../domain/repositories/AusentismoRepository';
import { EmailNotifier } from '../../../application/ports/EmailNotifier';
import { IdGenerator } from '../../../application/ports/IdGenerator';
import { EnlaceAusentismoGenerator } from '../../../application/ports/EnlaceAusentismoGenerator';
import { CrearAusentismo } from '../../../application/use-cases/CrearAusentismo';
import { ObtenerMisAusentismos } from '../../../application/use-cases/ObtenerMisAusentismos';
import { crearAusentismoSchema, historialAusentismoQuerySchema } from '../schemas/ausentismos.schemas';

interface AusentismosDeps {
    empleadoRepo: EmpleadoRepository;
    ausentismoRepo: AusentismoRepository;
    emailNotifier: EmailNotifier;
    idGenerator: IdGenerator;
    enlaceAusentismoGenerator: EnlaceAusentismoGenerator;
}

export function registerAusentismosRoutes(app: FastifyInstance, deps: AusentismosDeps): void {
    const crearAusentismo = new CrearAusentismo(deps.empleadoRepo, deps.ausentismoRepo, deps.emailNotifier, deps.idGenerator, deps.enlaceAusentismoGenerator);
    const obtenerMisAusentismos = new ObtenerMisAusentismos(deps.ausentismoRepo);

    app.post('/ausentismos', { preHandler: authenticate }, async (request, reply) => {
        const body = crearAusentismoSchema.parse(request.body);
        const empleadoId = (request.user as { sub: string }).sub;
        const dias = body.dias.map((d) => new Date(`${d}T00:00:00.000Z`));

        const ausentismo = await crearAusentismo.ejecutar({ empleadoId, motivo: body.motivo, comentario: body.comentario, dias });
        reply.status(201).send({ id: ausentismo.id, estatus: ausentismo.estatus });
    });

    app.get('/ausentismos/mios', { preHandler: authenticate }, async (request) => {
        const query = historialAusentismoQuerySchema.parse(request.query);
        const empleadoId = (request.user as { sub: string }).sub;

        const resultado = await obtenerMisAusentismos.ejecutar({ empleadoId, pagina: query.pagina, porPagina: query.porPagina });

        return {
            datos: resultado.datos.map((a) => ({
                id: a.id,
                motivo: a.motivo,
                comentario: a.comentario,
                dias: a.dias.map((d) => d.toISOString().slice(0, 10)),
                estatus: a.estatus,
                motivoRechazo: a.motivoRechazo,
                createdAt: a.createdAt.toISOString().slice(0, 10),
                resueltoAt: a.resueltoAt ? a.resueltoAt.toISOString().slice(0, 10) : null,
            })),
            total: resultado.total,
            pagina: resultado.pagina,
            porPagina: resultado.porPagina,
        };
    });
}