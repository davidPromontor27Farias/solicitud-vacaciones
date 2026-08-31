import { FastifyInstance } from 'fastify';
import { EmpleadoRepository } from '../../../domain/repositories/EmpleadoRepository';
import { SaldoVacacionesRepository } from '../../../domain/repositories/SaldoVacacionesRepository';
import { SolicitudVacacionesRepository } from '../../../domain/repositories/SolicitudVacacionesRepository';
import { ObtenerPerfilEmpleado } from '../../../application/use-cases/ObtenerPerfilEmpleado';
import { authenticate } from '../middlewares/authenticate';

interface EmpleadosDeps {
    empleadoRepo: EmpleadoRepository;
    saldoRepo: SaldoVacacionesRepository;
    solicitudRepo: SolicitudVacacionesRepository;
}

export function registerEmpleadosRoutes(app: FastifyInstance, deps: EmpleadosDeps): void {
    const obtenerPerfil = new ObtenerPerfilEmpleado(deps.empleadoRepo, deps.saldoRepo, deps.solicitudRepo);

    app.get('/empleados/yo', { preHandler: authenticate }, async (request, reply) => {
        const empleadoId = (request.user as { sub: string }).sub;
        const perfil = await obtenerPerfil.ejecutar(empleadoId);

        reply.send({
            ...perfil,
            saldos: perfil.saldos.map((s) => ({
                ...s,
                inicioValidez: s.inicioValidez.toISOString().slice(0, 10),
                finValidez: s.finValidez.toISOString().slice(0, 10),
                fechaVencimiento: s.fechaVencimiento.toISOString().slice(0, 10),
                fechaLimiteDisfrute: s.fechaLimiteDisfrute.toISOString().slice(0, 10)
            })),
            vacacionesProgramadas: perfil.vacacionesProgramadas.map((v) => ({
                ...v,
                dias: v.dias.map((d) => d.toISOString().slice(0, 10)),
            })),
        });
    });
}
