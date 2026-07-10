import { FastifyInstance } from 'fastify';
import { EmpleadoRepository } from '../../../domain/repositories/EmpleadoRepository';
import { TokenActivacionRepository } from '../../../domain/repositories/TokenActivacionRepository';
import { PasswordHasher } from '../../../application/ports/PasswordHasher';
import { IdGenerator } from '../../../application/ports/IdGenerator';
import { EmailNotifier } from '../../../application/ports/EmailNotifier';
import { VerificarNumeroEmpleado } from '../../../application/use-cases/VerificarNumeroEmpleado';
import { registrarCorreoPrimerAcceso as RegistrarCorreoPrimerAcceso } from '../../../application/use-cases/RegistrarCorreoPrimerAcceso';
import { CrearPassword } from '../../../application/use-cases/CrearPassword';
import { IniciarSesionConPassword } from '../../../application/use-cases/IniciarSesionConPassword';
import { SolicitarRestablecimientoPassword } from '../../../application/use-cases/SolicitarRestablecimientoPassword';
import {
    verificarNumeroEmpleadoSchema,
    registrarCorreoSchema,
    crearPasswordSchema,
    loginSchema,
} from '../schemas/auth.schemas';

interface AuthDeps {
    empleadoRepo: EmpleadoRepository;
    tokenRepo: TokenActivacionRepository;
    passwordHasher: PasswordHasher;
    idGenerator: IdGenerator;
    emailNotifier: EmailNotifier;
}

export function registerAuthRoutes(app: FastifyInstance, deps: AuthDeps): void {
    const verificarNumeroEmpleado = new VerificarNumeroEmpleado(deps.empleadoRepo);
    const registrarCorreo = new RegistrarCorreoPrimerAcceso(
        deps.empleadoRepo,
        deps.tokenRepo,
        deps.emailNotifier,
        deps.idGenerator,
    );
        const crearPassword = new CrearPassword(deps.empleadoRepo, deps.tokenRepo, deps.passwordHasher);
    const iniciarSesion = new IniciarSesionConPassword(deps.empleadoRepo, deps.passwordHasher);
    const solicitarRestablecimiento = new SolicitarRestablecimientoPassword(
        deps.empleadoRepo,
        deps.tokenRepo,
        deps.emailNotifier,
        deps.idGenerator,
    );

    app.post('/auth/verificar-numero-empleado', async (request, reply) => {
        const body = verificarNumeroEmpleadoSchema.parse(request.body);
        const resultado = await verificarNumeroEmpleado.ejecutar(body.numeroEmpleado);
        reply.send(resultado);
    });

    app.post('/auth/registrar-correo', async (request, reply) => {
        const body = registrarCorreoSchema.parse(request.body);
        await registrarCorreo.ejecutar(body);
        reply.send({ ok: true });
    });

    app.post('/auth/crear-password', async (request, reply) => {
        const body = crearPasswordSchema.parse(request.body);
        await crearPassword.ejecutar(body);
        reply.send({ ok: true });
    });

    app.post('/auth/solicitar-restablecimiento', async (request, reply) => {
        const body = verificarNumeroEmpleadoSchema.parse(request.body);
        await solicitarRestablecimiento.ejecutar({ numeroEmpleado: body.numeroEmpleado });
        reply.send({ ok: true });
    });

    app.post('/auth/login', async (request, reply) => {
        const body = loginSchema.parse(request.body);
        const empleado = await iniciarSesion.ejecutar(body);
        const token = app.jwt.sign({ sub: empleado.id, numeroEmpleado: empleado.numeroEmpleado }, { expiresIn: '8h' });
        reply.send({ token, empleado: { id: empleado.id, nombre: empleado.nombre, primerAcceso: empleado.primerAcceso } });
    });
}