import { FastifyInstance } from 'fastify';
import { EmpleadoRepository } from '../../../domain/repositories/EmpleadoRepository';
import { SaldoVacacionesRepository } from '../../../domain/repositories/SaldoVacacionesRepository';
import { ObtenerPerfilEmpleado } from '../../../application/use-cases/ObtenerPerfilEmpleado';
import { authenticate } from '../middlewares/authenticate';

interface EmpleadosDeps {
    empleadoRepo: EmpleadoRepository;
    saldoRepo: SaldoVacacionesRepository;
}

export function registerEmpleadosRoutes(app: FastifyInstance, deps: EmpleadosDeps): void {
    const obtenerPerfil = new ObtenerPerfilEmpleado(deps.empleadoRepo, deps.saldoRepo);

    app.get('/empleados/yo', { preHandler: authenticate }, async (request, reply) => {
        const empleadoId = (request.user as { sub: string }).sub;
        const perfil = await obtenerPerfil.ejecutar(empleadoId);

        reply.send({
            ...perfil,
            saldos: perfil.saldos.map((s) => ({
                ...s,
                inicioValidez: s.inicioValidez.toISOString().slice(0, 10),
                fechaVencimiento: s.fechaVencimiento.toISOString().slice(0, 10),
            })),
        });
    });
}
