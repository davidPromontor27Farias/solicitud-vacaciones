import { FastifyInstance } from 'fastify';
import { EmpleadoRepository } from '../../../domain/repositories/EmpleadoRepository';
import { SaldoVacacionesRepository } from '../../../domain/repositories/SaldoVacacionesRepository';
import { SolicitudVacacionesRepository } from '../../../domain/repositories/SolicitudVacacionesRepository';
import { EmailNotifier } from '../../../application/ports/EmailNotifier';
import { IdGenerator } from '../../../application/ports/IdGenerator';
import { EnlaceRevisionGenerator } from '../../../application/ports/EnlaceRevisionGenerator';
import { CrearSolicitudVacaciones } from '../../../application/use-cases/CrearSolicitudVacaciones';
import { authenticate } from '../middlewares/authenticate';
import { crearSolicitudSchema, historialEmpleadoQuerySchema, historialEquipoQuerySchema, revocarSolicitudSchema, rechazarSolicitudSchema } from '../schemas/solicitudes.schemas';
import { AprobarSolicitud } from '../../../application/use-cases/AprobarSolicitud';
import { RechazarSolicitud } from '../../../application/use-cases/RechazarSolicitud';
import { RevocarSolicitud } from '../../../application/use-cases/RevocarSolicitud';
import { aprobarSolicitudSchema } from '../schemas/solicitudes.schemas';
import { ObtenerHistorialEmpleado } from '../../../application/use-cases/ObtenerHistorialEmpleado';
import { ObtenerHistorialEquipo } from '../../../application/use-cases/ObtenerHistorialEquipo';

interface SolicitudesDeps {
    empleadoRepo: EmpleadoRepository;
    saldoRepo: SaldoVacacionesRepository;
    solicitudRepo: SolicitudVacacionesRepository;
    emailNotifier: EmailNotifier;
    idGenerator: IdGenerator;
    enlaceGenerator: EnlaceRevisionGenerator;
}

export function registerSolicitudesRoutes(app: FastifyInstance, deps: SolicitudesDeps): void {
    const crearSolicitud = new CrearSolicitudVacaciones(
        deps.empleadoRepo,
        deps.saldoRepo,
        deps.solicitudRepo,
        deps.emailNotifier,
        deps.idGenerator,
        deps.enlaceGenerator,
    );

    const aprobarSolicitud = new AprobarSolicitud(deps.empleadoRepo, deps.saldoRepo, deps.solicitudRepo, deps.emailNotifier, deps.enlaceGenerator);
    const rechazarSolicitud = new RechazarSolicitud(deps.empleadoRepo, deps.solicitudRepo, deps.emailNotifier);
    const revocarSolicitud = new RevocarSolicitud(deps.empleadoRepo, deps.saldoRepo, deps.solicitudRepo, deps.emailNotifier);
    const obtenerHistorialEmpleado = new ObtenerHistorialEmpleado(deps.solicitudRepo);
    const obtenerHistorialEquipo = new ObtenerHistorialEquipo(deps.solicitudRepo);


    app.post('/solicitudes', { preHandler: authenticate }, async (request, reply) => {
        const body = crearSolicitudSchema.parse(request.body);
        const empleadoId = (request.user as { sub: string }).sub;
        const dias = body.dias.map((d) => new Date(`${d}T00:00:00.000Z`));

        const solicitud = await crearSolicitud.ejecutar({ empleadoId, dias, backupNombre: body.backupNombre});


        reply.status(201).send({
            id: solicitud.id,
            estatus: solicitud.estatus,
            dias: solicitud.dias.map((d) => d.toISOString().slice(0, 10)),
        });
    });

    app.post('/solicitudes/:id/aprobar', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = aprobarSolicitudSchema.parse(request.body);
    const aprobadorId = (request.user as { sub: string }).sub;

    const solicitud = await aprobarSolicitud.ejecutar({
        solicitudId: id,
        aprobadorId
    });

        reply.send({ id: solicitud.id, estatus: solicitud.estatus, backupNombre: solicitud.backupNombre });
    });

    app.post('/solicitudes/:id/rechazar', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = rechazarSolicitudSchema.parse(request.body);
    const aprobadorId = (request.user as { sub: string }).sub;

    const solicitud = await rechazarSolicitud.ejecutar({ solicitudId: id, aprobadorId, motivo: body.motivo });

        reply.send({ id: solicitud.id, estatus: solicitud.estatus, motivoRechazo: solicitud.motivoRechazo });
    });


    app.post('/solicitudes/:id/revocar', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = revocarSolicitudSchema.parse(request.body);
    const revocadoPorId = (request.user as { sub: string }).sub;

    const solicitud = await revocarSolicitud.ejecutar({
        solicitudId: id,
        revocadoPorId,
        motivo: body.motivo,
    });

    reply.send({ id: solicitud.id, estatus: solicitud.estatus, motivoRevocacion: solicitud.motivoRevocacion });



    });

    app.get('/solicitudes/mias', { preHandler: authenticate }, async (request, reply) => {
    const query = historialEmpleadoQuerySchema.parse(request.query);
    const empleadoId = (request.user as { sub: string }).sub;

    const resultado = await obtenerHistorialEmpleado.ejecutar({
        empleadoId,
        pagina: query.pagina,
        porPagina: query.porPagina,
    });

    reply.send({
        datos: resultado.datos.map((s) => ({
            id: s.id,
            estatus: s.estatus,
            dias: s.dias.map((d) => d.toISOString().slice(0, 10)),
            backupNombre: s.backupNombre,
        })),
        total: resultado.total,
        pagina: resultado.pagina,
        porPagina: resultado.porPagina,
        }); 
    });

    app.get('/solicitudes/equipo', { preHandler: authenticate }, async (request, reply) => {
    const query = historialEquipoQuerySchema.parse(request.query);
    const jefeDirectoId = (request.user as { sub: string }).sub;

    const hoy = Date.now();
    const desde = query.desde ?? new Date(hoy - 90 * 24 * 60 * 60 * 1000);
    const hasta = query.hasta ?? new Date(hoy + 90 * 24 * 60 * 60 * 1000);

    const [solicitudes, equipo] = await Promise.all([
        obtenerHistorialEquipo.ejecutar({ jefeDirectoId, desde, hasta }),
        deps.empleadoRepo.listarEquipoDirecto(jefeDirectoId),
    ]);
    const nombrePorEmpleadoId = new Map(equipo.map((e) => [e.id, e.nombre]));

    reply.send(solicitudes.map((s) => ({
        id: s.id,
        empleadoId: s.empleadoId,
        empleadoNombre: nombrePorEmpleadoId.get(s.empleadoId) ?? null,
        estatus: s.estatus,
        dias: s.dias.map((d) => d.toISOString().slice(0, 10)),
        })));
    });

    app.get('/solicitudes/mi-equipo', { preHandler: authenticate }, async (request, reply) => {
    const query = historialEquipoQuerySchema.parse(request.query);
    const empleadoId = (request.user as { sub: string }).sub;

    const empleado = await deps.empleadoRepo.buscarPorId(empleadoId);
    if (!empleado?.jefeDirectoId) {
        reply.send([]);
        return;
    }

    const hoy = Date.now();
    const desde = query.desde ?? new Date(hoy - 90 * 24 * 60 * 60 * 1000);
    const hasta = query.hasta ?? new Date(hoy + 90 * 24 * 60 * 60 * 1000);

    const [solicitudes, equipo] = await Promise.all([
        obtenerHistorialEquipo.ejecutar({ jefeDirectoId: empleado.jefeDirectoId, desde, hasta }),
        deps.empleadoRepo.listarEquipoDirecto(empleado.jefeDirectoId),
    ]);
    const nombrePorEmpleadoId = new Map(equipo.map((e) => [e.id, e.nombre]));

    reply.send(solicitudes
        .filter((s) => s.estatus === 'aprobada')
        .map((s) => ({
            id: s.id,
            empleadoId: s.empleadoId,
            empleadoNombre: nombrePorEmpleadoId.get(s.empleadoId) ?? null,
            estatus: s.estatus,
            dias: s.dias.map((d) => d.toISOString().slice(0, 10)),
        })));
    });


}