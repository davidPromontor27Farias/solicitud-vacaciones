import { FastifyInstance } from 'fastify';
import { EmpleadoRepository } from '../../../domain/repositories/EmpleadoRepository';
import { SaldoVacacionesRepository } from '../../../domain/repositories/SaldoVacacionesRepository';
import { SolicitudVacacionesRepository } from '../../../domain/repositories/SolicitudVacacionesRepository';
import { EmailNotifier } from '../../../application/ports/EmailNotifier';
import { EnlaceRevisionGenerator } from '../../../application/ports/EnlaceRevisionGenerator';
import { ObtenerDetalleRevision } from '../../../application/use-cases/ObtenerDetalleRevision';
import { AprobarSolicitud } from '../../../application/use-cases/AprobarSolicitud';
import { RechazarSolicitud } from '../../../application/use-cases/RechazarSolicitud';
import { aprobarSolicitudSchema } from '../schemas/solicitudes.schemas';
import { UnauthorizedError } from '../../../shared/errors';

interface RevisionDeps {
    empleadoRepo: EmpleadoRepository;
    saldoRepo: SaldoVacacionesRepository;
    solicitudRepo: SolicitudVacacionesRepository;
    emailNotifier: EmailNotifier;
    enlaceGenerator: EnlaceRevisionGenerator;
}

export function registerRevisionRoutes(app: FastifyInstance, deps: RevisionDeps): void {
    const obtenerDetalle = new ObtenerDetalleRevision(deps.empleadoRepo, deps.solicitudRepo);
    const aprobarSolicitud = new AprobarSolicitud(deps.empleadoRepo, deps.saldoRepo, deps.solicitudRepo, deps.emailNotifier);
    const rechazarSolicitud = new RechazarSolicitud(deps.empleadoRepo, deps.solicitudRepo, deps.emailNotifier);

    function verificarToken(token: string) {
        const payload = deps.enlaceGenerator.verificar(token);
        if (!payload) {
            throw new UnauthorizedError('Enlace inválido o expirado');
        }
        return payload;
    }

    app.get('/revision/:token', async (request) => {
        const { token } = request.params as { token: string };
        const payload = verificarToken(token);
        return obtenerDetalle.ejecutar({ solicitudId: payload.solicitudId, jefeId: payload.jefeId });
    });

    app.post('/revision/:token/aprobar', async (request) => {
        const { token } = request.params as { token: string };
        const payload = verificarToken(token);
        const body = aprobarSolicitudSchema.parse(request.body);

        const solicitud = await aprobarSolicitud.ejecutar({
            solicitudId: payload.solicitudId,
            aprobadorId: payload.jefeId,
            backupNombre: body.backupNombre,
        });

        return { id: solicitud.id, estatus: solicitud.estatus };
    });

    app.post('/revision/:token/rechazar', async (request) => {
        const { token } = request.params as { token: string };
        const payload = verificarToken(token);

        const solicitud = await rechazarSolicitud.ejecutar({
            solicitudId: payload.solicitudId,
            aprobadorId: payload.jefeId,
        });

        return { id: solicitud.id, estatus: solicitud.estatus };
    });
}
