import { FastifyInstance } from "fastify";
import { EmpleadoRepository } from "../../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../../domain/repositories/SolicitudVacacionesRepository";
import { IniciarSesionJefe } from "../../../application/use-cases/IniciarSesionJefe";
import { ListarEquipoConVacaciones } from "../../../application/use-cases/ListarEquipoConVacaciones";
import { ListarTodosConVacaciones } from "../../../application/use-cases/ListarTodosConVacaciones";
import { ObtenerArbolMatricial, NodoArbolMatricial } from "../../../application/use-cases/ObtenerArbolMatricial";
import { ObtenerVacacionesAprobadasEquipo } from "../../../application/use-cases/ObtenerVacacionesAprobadasEquipo";
import { ObtenerNotificacionesJefe } from "../../../application/use-cases/ObtenerNotificacionesJefe";
import { RevocarSolicitud } from "../../../application/use-cases/RevocarSolicitud";
import { EnlaceRevisionGenerator } from "../../../application/ports/EnlaceRevisionGenerator";
import { EmailNotifier } from "../../../application/ports/EmailNotifier";
import { authenticateJefe } from "../middlewares/authenticateJefe";
import { jefeLoginSchema, revocarVacacionesJefeSchema } from "../schemas/jefe.schemas";

interface JefeDeps {
    empleadoRepo: EmpleadoRepository;
    saldoRepo: SaldoVacacionesRepository;
    solicitudRepo: SolicitudVacacionesRepository;
    enlaceGenerator: EnlaceRevisionGenerator;
    emailNotifier: EmailNotifier;
}

export function registerJefeRoutes(app: FastifyInstance, deps: JefeDeps): void {
    const iniciarSesionJefe = new IniciarSesionJefe(deps.empleadoRepo);
    const listarEquipoConVacaciones = new ListarEquipoConVacaciones(deps.empleadoRepo, deps.saldoRepo);
    const listarTodosConVacaciones = new ListarTodosConVacaciones(deps.empleadoRepo, deps.saldoRepo);
    const obtenerArbolMatricial = new ObtenerArbolMatricial(deps.empleadoRepo, deps.saldoRepo);
    const obtenerVacacionesAprobadasEquipo = new ObtenerVacacionesAprobadasEquipo(deps.solicitudRepo, deps.empleadoRepo);
    const obtenerNotificacionesJefe = new ObtenerNotificacionesJefe(deps.solicitudRepo, deps.empleadoRepo, deps.enlaceGenerator);
    const revocarSolicitud = new RevocarSolicitud(deps.empleadoRepo, deps.saldoRepo, deps.solicitudRepo, deps.emailNotifier);

    app.post('/jefe/login', {
        config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    }, async (request, reply) => {
        const body = jefeLoginSchema.parse(request.body);
        const { empleado, tieneMatricial } = await iniciarSesionJefe.ejecutar(body);
        const token = app.jwt.sign(
            {
                sub: empleado.id,
                numeroEmpleado: empleado.numeroEmpleado,
                nombre: empleado.nombre,
                rol: 'jefe',
                accesoTotal: empleado.esDirectorGeneral,
                tieneMatricial,
            },
            { expiresIn: '8h' },
        );
        reply.send({
            token,
            jefe: {
                id: empleado.id,
                numeroEmpleado: empleado.numeroEmpleado,
                nombre: empleado.nombre,
                accesoTotal: empleado.esDirectorGeneral,
                tieneMatricial,
            },
        });
    });

    app.get('/jefe/equipo', { preHandler: authenticateJefe }, async (request) => {
        const jefeId = (request.user as { sub: string }).sub;
        const equipo = await listarEquipoConVacaciones.ejecutar(jefeId);
        return equipo.map((e) => ({
            ...e,
            saldos: e.saldos.map((s) => ({
                ...s,
                inicioValidez: s.inicioValidez.toISOString().slice(0, 10),
                finValidez: s.finValidez.toISOString().slice(0, 10),
                fechaLimiteDisfrute: s.fechaLimiteDisfrute.toISOString().slice(0, 10),
            })),
        }));
    });

    app.get('/jefe/todos-los-departamentos', { preHandler: authenticateJefe }, async (request, reply) => {
        const { accesoTotal } = request.user as { accesoTotal?: boolean };
        if (!accesoTotal) {
            reply.status(403).send({ error: 'No autorizado' });
            return;
        }

        const todos = await listarTodosConVacaciones.ejecutar();
        return todos.map((e) => ({
            ...e,
            saldos: e.saldos.map((s) => ({
                ...s,
                inicioValidez: s.inicioValidez.toISOString().slice(0, 10),
                finValidez: s.finValidez.toISOString().slice(0, 10),
                fechaLimiteDisfrute: s.fechaLimiteDisfrute.toISOString().slice(0, 10),
            })),
        }));
    });

    app.get('/jefe/matricial', { preHandler: authenticateJefe }, async (request, reply) => {
        const { sub: jefeId, tieneMatricial } = request.user as { sub: string; tieneMatricial?: boolean };
        if (!tieneMatricial) {
            reply.status(403).send({ error: 'No autorizado' });
            return;
        }

        const arbol = await obtenerArbolMatricial.ejecutar(jefeId);
        if (!arbol) {
            reply.status(404).send({ error: 'No encontrado' });
            return;
        }

        const serializar = (nodo: NodoArbolMatricial): unknown => ({
            ...nodo,
            fechaLimiteDisfrute: nodo.fechaLimiteDisfrute ? nodo.fechaLimiteDisfrute.toISOString().slice(0, 10) : null,
            hijos: nodo.hijos.map(serializar),
        });

        return serializar(arbol);
    });

    // Vacaciones ya aprobadas de los subordinados directos y matriciales del jefe, para
    // llevar control de quien tiene vacaciones encima y poder revocarlas desde aqui.
    app.get('/jefe/vacaciones-equipo', { preHandler: authenticateJefe }, async (request) => {
        const jefeId = (request.user as { sub: string }).sub;
        const hoy = new Date();
        const desde = new Date(Date.UTC(hoy.getUTCFullYear() - 1, hoy.getUTCMonth(), 1));
        const hasta = new Date(Date.UTC(hoy.getUTCFullYear() + 1, hoy.getUTCMonth() + 1, 0));

        const solicitudes = await obtenerVacacionesAprobadasEquipo.ejecutar({ jefeId, desde, hasta });
        return solicitudes.map((s) => ({
            solicitudId: s.solicitudId,
            empleadoId: s.empleadoId,
            empleadoNombre: s.empleadoNombre,
            dias: s.dias.map((d) => d.toISOString().slice(0, 10)),
        }));
    });

    // Revoca una solicitud aprobada (total o parcialmente, segun los dias que se manden).
    // Lo puede hacer el jefe directo o el jefe matricial del empleado indistintamente.
    app.post('/jefe/vacaciones-equipo/:solicitudId/revocar', { preHandler: authenticateJefe }, async (request) => {
        const jefeId = (request.user as { sub: string }).sub;
        const { solicitudId } = request.params as { solicitudId: string };
        const body = revocarVacacionesJefeSchema.parse(request.body);

        const solicitud = await revocarSolicitud.ejecutar({
            solicitudId,
            revocadoPorId: jefeId,
            motivo: body.motivo,
            dias: body.dias?.map((iso) => new Date(`${iso}T00:00:00.000Z`)),
        });

        return { id: solicitud.id, estatus: solicitud.estatus, diasActivos: solicitud.diasActivos.map((d) => d.toISOString().slice(0, 10)) };
    });

    // Solicitudes pendientes por aprobar de los subordinados directos, para la campana de
    // notificaciones del panel. enlaceToken lleva a la misma pantalla que el enlace del correo.
    app.get('/jefe/notificaciones', { preHandler: authenticateJefe }, async (request) => {
        const jefeId = (request.user as { sub: string }).sub;
        const notificaciones = await obtenerNotificacionesJefe.ejecutar(jefeId);
        return notificaciones.map((n) => ({
            solicitudId: n.solicitudId,
            empleadoNombre: n.empleadoNombre,
            dias: n.dias.map((d) => d.toISOString().slice(0, 10)),
            createdAt: n.createdAt.toISOString(),
            enlaceToken: n.enlaceToken,
        }));
    });
}
