import { FastifyInstance } from 'fastify';
import { EmpleadoRepository } from '../../../domain/repositories/EmpleadoRepository';
import { AusentismoRepository } from '../../../domain/repositories/AusentismoRepository';
import { EmailNotifier } from '../../../application/ports/EmailNotifier';
import { EnlaceAusentismoGenerator } from '../../../application/ports/EnlaceAusentismoGenerator';
import { ObtenerDetalleRevisionAusentismo } from '../../../application/use-cases/ObtenerDetalleRevisionAusentismo';
import { AprobarAusentismo } from '../../../application/use-cases/AprobarAusentismo';
import { RechazarAusentismo } from '../../../application/use-cases/RechazarAusentismo';
import { rechazarAusentismoSchema } from '../schemas/ausentismos.schemas';
import { UnauthorizedError } from '../../../shared/errors';

interface RevisionAusentismoDeps {
    empleadoRepo: EmpleadoRepository;
    ausentismoRepo: AusentismoRepository;
    emailNotifier: EmailNotifier;
    enlaceAusentismoGenerator: EnlaceAusentismoGenerator;
}


export function registerRevisionAusentismoRoutes(app: FastifyInstance, deps: RevisionAusentismoDeps): void {
    const obtenerDetalle = new ObtenerDetalleRevisionAusentismo(deps.empleadoRepo, deps.ausentismoRepo);
    const aprobarAusentismo = new AprobarAusentismo(deps.empleadoRepo, deps.ausentismoRepo, deps.emailNotifier);
    const rechazarAusentismo = new RechazarAusentismo(deps.empleadoRepo, deps.ausentismoRepo, deps.emailNotifier);

    function verificarToken(token: string) {
        const payload = deps.enlaceAusentismoGenerator.verificar(token);
        if (!payload) throw new UnauthorizedError('Enlace inválido o expirado');
        return payload;
    }

    app.get('/revision-ausentismo/:token', async (request) => {
        const { token } = request.params as { token: string };
        const payload = verificarToken(token);
        return obtenerDetalle.ejecutar({ ausentismoId: payload.ausentismoId, jefeId: payload.jefeId });
    });

    app.post('/revision-ausentismo/:token/aprobar', async (request) => {
        const { token } = request.params as { token: string };
        const payload = verificarToken(token);
        const ausentismo = await aprobarAusentismo.ejecutar({ ausentismoId: payload.ausentismoId, aprobadorId: payload.jefeId });
        return { id: ausentismo.id, estatus: ausentismo.estatus };
    });

    app.post('/revision-ausentismo/:token/rechazar', async (request) => {
        const { token } = request.params as { token: string };
        const payload = verificarToken(token);
        const body = rechazarAusentismoSchema.parse(request.body);
        const ausentismo = await rechazarAusentismo.ejecutar({ ausentismoId: payload.ausentismoId, aprobadorId: payload.jefeId, motivo: body.motivo });
        return { id: ausentismo.id, estatus: ausentismo.estatus };
    });
}