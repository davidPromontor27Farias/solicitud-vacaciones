import { FastifyInstance } from "fastify";
import { EmpleadoRepository } from "../../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../../domain/repositories/SaldoVacacionesRepository";
import { PlanificacionVacacionesRepository } from "../../../domain/repositories/PlanificacionVacacionesRepository";
import { IdGenerator } from "../../../application/ports/IdGenerator";
import { IniciarSesionJefe } from "../../../application/use-cases/IniciarSesionJefe";
import { ListarEquipoConVacaciones } from "../../../application/use-cases/ListarEquipoConVacaciones";
import { CrearPlanificacion } from "../../../application/use-cases/CrearPlanificacion";
import { ListarPlanificacion } from "../../../application/use-cases/ListarPlanificacion";
import { EliminarPlanificacion } from "../../../application/use-cases/EliminarPlanificacion";
import { authenticateJefe } from "../middlewares/authenticateJefe";
import { jefeLoginSchema, crearPlanificacionSchema } from "../schemas/jefe.schemas";

interface JefeDeps {
    empleadoRepo: EmpleadoRepository;
    saldoRepo: SaldoVacacionesRepository;
    planificacionRepo: PlanificacionVacacionesRepository;
    idGenerator: IdGenerator;
}

export function registerJefeRoutes(app: FastifyInstance, deps: JefeDeps): void {
    const iniciarSesionJefe = new IniciarSesionJefe(deps.empleadoRepo);
    const listarEquipoConVacaciones = new ListarEquipoConVacaciones(deps.empleadoRepo, deps.saldoRepo);
    const crearPlanificacion = new CrearPlanificacion(deps.empleadoRepo, deps.planificacionRepo, deps.idGenerator);
    const listarPlanificacion = new ListarPlanificacion(deps.planificacionRepo);
    const eliminarPlanificacion = new EliminarPlanificacion(deps.planificacionRepo);

    app.post('/jefe/login', {
        config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    }, async (request, reply) => {
        const body = jefeLoginSchema.parse(request.body);
        const empleado = await iniciarSesionJefe.ejecutar(body);
        const token = app.jwt.sign(
            { sub: empleado.id, numeroEmpleado: empleado.numeroEmpleado, nombre: empleado.nombre, rol: 'jefe' },
            { expiresIn: '8h' },
        );
        reply.send({ token, jefe: { id: empleado.id, numeroEmpleado: empleado.numeroEmpleado, nombre: empleado.nombre } });
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

    app.get('/jefe/planificacion', { preHandler: authenticateJefe }, async (request) => {
        const jefeId = (request.user as { sub: string }).sub;
        const planificaciones = await listarPlanificacion.ejecutar(jefeId);
        return planificaciones.map((p) => ({
            id: p.id,
            empleadoId: p.empleadoId,
            fecha: p.fecha.toISOString().slice(0, 10),
            nota: p.nota,
        }));
    });

    app.post('/jefe/planificacion', { preHandler: authenticateJefe }, async (request, reply) => {
        const jefeId = (request.user as { sub: string }).sub;
        const body = crearPlanificacionSchema.parse(request.body);

        const planificacion = await crearPlanificacion.ejecutar({
            jefeId,
            empleadoId: body.empleadoId,
            fecha: new Date(`${body.fecha}T00:00:00.000Z`),
            nota: body.nota ?? null,
        });

        reply.status(201).send({
            id: planificacion.id,
            empleadoId: planificacion.empleadoId,
            fecha: planificacion.fecha.toISOString().slice(0, 10),
            nota: planificacion.nota,
        });
    });

    app.delete('/jefe/planificacion/:id', { preHandler: authenticateJefe }, async (request, reply) => {
        const jefeId = (request.user as { sub: string }).sub;
        const { id } = request.params as { id: string };

        await eliminarPlanificacion.ejecutar({ id, jefeId });
        reply.status(204).send();
    });
}
