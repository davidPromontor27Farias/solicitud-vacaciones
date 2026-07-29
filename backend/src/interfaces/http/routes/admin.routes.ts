import { FastifyInstance } from "fastify";
import { PasswordHasher } from "../../../application/ports/PasswordHasher";
import { IniciarSesionAdmin } from "../../../application/use-cases/IniciarSesionAdmin";
import { ListarDepartamentos } from "../../../application/use-cases/ListarDepartamentos";
import { ListarEmpleadosPorDepartamento } from "../../../application/use-cases/ListarEmpleadosPorDepartamento";
import { ListarVacacionesCriticas } from "../../../application/use-cases/ListarVacacionesCriticas";
import { ObtenerDetalleEmpleadoAdmin } from "../../../application/use-cases/ObtenerDetalleEmpleadoAdmin";
import { AdminRepository } from "../../../domain/repositories/AdminRepository";
import { EmpleadoRepository } from "../../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../../domain/repositories/SaldoVacacionesRepository";
import { authenticateAdmin } from "../middlewares/authenticateAdmin";
import { adminLoginSchema } from "../schemas/admin.schemas";



interface AdminDeps{
    adminRepo: AdminRepository;
    empleadoRepo: EmpleadoRepository;
    saldoRepo: SaldoVacacionesRepository;
    passwordHasher: PasswordHasher;
}

export function registerAdminRoutes(app: FastifyInstance, deps: AdminDeps): void{
    const iniciarSesionAdmin = new IniciarSesionAdmin(deps.adminRepo, deps.passwordHasher);
    const listarDepartamentos = new ListarDepartamentos(deps.empleadoRepo);
    const listarEmpleadosPorDepartamento = new ListarEmpleadosPorDepartamento(deps.empleadoRepo, deps.saldoRepo);
    const listarVacacionesCriticas = new ListarVacacionesCriticas(deps.empleadoRepo, deps.saldoRepo);
    const obtenerDetalleEmpleadoAdmin = new ObtenerDetalleEmpleadoAdmin(deps.empleadoRepo, deps.saldoRepo);

    app.post('/admin/login', {
        config: {rateLimit: {max: 10, timeWindow: '1 minute'}},
    }, async(request, reply) =>  {
        const body = adminLoginSchema.parse(request.body);
        const admin = await iniciarSesionAdmin.ejecutar(body);
        const token = app.jwt.sign({sub: admin.id, usuario: admin.usuario, rol: 'admin', rolAdmin: admin.rol}, {expiresIn: '8h'});
        reply.send({token, admin: {id: admin.id, nombre: admin.nombre, usuario: admin.usuario, rol: admin.rol}});
    }); 

    app.get('/admin/departamentos', {preHandler: authenticateAdmin}, async ()=>{
        return listarDepartamentos.ejecutar();
    });

    app.get('/admin/departamentos/:nombre/empleados', { preHandler: authenticateAdmin }, async (request) => {
        const { nombre } = request.params as { nombre: string };
        return listarEmpleadosPorDepartamento.ejecutar({ departamento: decodeURIComponent(nombre) });
    });

    app.get('/admin/vacaciones-criticas', { preHandler: authenticateAdmin }, async () => {
        return listarVacacionesCriticas.ejecutar();
    });

    app.get('/admin/empleados/:id', { preHandler: authenticateAdmin }, async (request) => {
        const { id } = request.params as { id: string };
        return obtenerDetalleEmpleadoAdmin.ejecutar({ empleadoId: id });
    });

}