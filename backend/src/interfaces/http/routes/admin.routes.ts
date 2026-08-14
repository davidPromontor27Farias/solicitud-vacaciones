import * as xlsx from "xlsx";
import { FastifyInstance } from "fastify";
import { PasswordHasher } from "../../../application/ports/PasswordHasher";
import { IniciarSesionAdmin } from "../../../application/use-cases/IniciarSesionAdmin";
import { ListarDepartamentos } from "../../../application/use-cases/ListarDepartamentos";
import { ListarEmpleadosPorDepartamento } from "../../../application/use-cases/ListarEmpleadosPorDepartamento";
import { ListarVacacionesCriticas } from "../../../application/use-cases/ListarVacacionesCriticas";
import { ObtenerDetalleEmpleadoAdmin } from "../../../application/use-cases/ObtenerDetalleEmpleadoAdmin";
import { ActualizarCorreosJefes } from "../../../application/use-cases/ActualizarCorreosJefes";
import { ListarSolicitudesPorEstatus } from "../../../application/use-cases/ListarSolicitudesPorEstatus";
import { ImportarReporteVacaciones } from "../../../application/use-cases/ImportarReporteVacaciones";
import { ListarHistorialCargas } from "../../../application/use-cases/ListarHistorialCargas";
import { IdGenerator } from "../../../application/ports/IdGenerator";
import { AdminRepository } from "../../../domain/repositories/AdminRepository";
import { EmpleadoRepository } from "../../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../../domain/repositories/SolicitudVacacionesRepository";
import { ImportacionNominaRepository } from "../../../domain/repositories/ImportacionNominaRepository";
import { ImportacionCorreosJefesRepository } from "../../../domain/repositories/ImportacionCorreosJefesRepository";
import { authenticateAdmin } from "../middlewares/authenticateAdmin";
import { authenticateAdminNominas } from "../middlewares/authenticateAdminNominas";
import { adminLoginSchema, solicitudesPorEstatusQuerySchema, reporteSolicitudesQuerySchema } from "../schemas/admin.schemas";
import { ValidationError } from "../../../shared/errors";



interface AdminDeps{
    adminRepo: AdminRepository;
    empleadoRepo: EmpleadoRepository;
    saldoRepo: SaldoVacacionesRepository;
    solicitudRepo: SolicitudVacacionesRepository;
    importacionNominaRepo: ImportacionNominaRepository;
    importacionCorreosRepo: ImportacionCorreosJefesRepository;
    passwordHasher: PasswordHasher;
    idGenerator: IdGenerator;
}

export function registerAdminRoutes(app: FastifyInstance, deps: AdminDeps): void{
    const iniciarSesionAdmin = new IniciarSesionAdmin(deps.adminRepo, deps.passwordHasher);
    const listarDepartamentos = new ListarDepartamentos(deps.empleadoRepo);
    const listarEmpleadosPorDepartamento = new ListarEmpleadosPorDepartamento(deps.empleadoRepo, deps.saldoRepo);
    const listarVacacionesCriticas = new ListarVacacionesCriticas(deps.empleadoRepo, deps.saldoRepo);
    const obtenerDetalleEmpleadoAdmin = new ObtenerDetalleEmpleadoAdmin(deps.empleadoRepo, deps.saldoRepo);
    const actualizarCorreosJefes = new ActualizarCorreosJefes(deps.empleadoRepo, deps.importacionCorreosRepo);
    const listarSolicitudesPorEstatus = new ListarSolicitudesPorEstatus(deps.solicitudRepo, deps.empleadoRepo);
    const importarReporteVacaciones = new ImportarReporteVacaciones(
        deps.empleadoRepo,
        deps.saldoRepo,
        deps.importacionNominaRepo,
        deps.idGenerator,
    );
    const listarHistorialCargas = new ListarHistorialCargas(deps.importacionNominaRepo, deps.importacionCorreosRepo);

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

    app.post('/admin/nomina/correos-jefes', { preHandler: authenticateAdminNominas }, async (request) => {
        const archivo = await request.file();
        if (!archivo) {
            throw new ValidationError('Debes adjuntar un archivo Excel (.xlsx)');
        }
        const buffer = await archivo.toBuffer();
        const { sub: adminId } = request.user as { sub: string };
        return actualizarCorreosJefes.ejecutar({
            archivoBuffer: buffer,
            nombreArchivo: archivo.filename,
            adminId,
        });
    });

    app.get('/admin/nomina/historial', { preHandler: authenticateAdminNominas }, async () => {
        return listarHistorialCargas.ejecutar();
    });

    app.post('/admin/nomina/reporte-vacaciones', { preHandler: authenticateAdminNominas }, async (request) => {
        const archivo = await request.file();
        if (!archivo) {
            throw new ValidationError('Debes adjuntar un archivo Excel (.xlsx)');
        }
        const buffer = await archivo.toBuffer();
        const { sub: adminId } = request.user as { sub: string };
        return importarReporteVacaciones.ejecutar({
            archivoBuffer: buffer,
            nombreArchivo: archivo.filename,
            adminId,
        });
    });

    app.get('/admin/nomina/solicitudes', { preHandler: authenticateAdminNominas }, async (request) => {
        const query = solicitudesPorEstatusQuerySchema.parse(request.query);
        return listarSolicitudesPorEstatus.ejecutar(query);
    });

    app.get('/admin/nomina/reportes/solicitudes', { preHandler: authenticateAdminNominas }, async (request, reply) => {
        const { estatus, porPagina } = reporteSolicitudesQuerySchema.parse(request.query);
        const resultado = await listarSolicitudesPorEstatus.ejecutar({ estatus, pagina: 1, porPagina });

        const filas = resultado.datos.map((s) => ({
            'Número de empleado': s.numeroEmpleado,
            Nombre: s.nombre,
            Departamento: s.departamento ?? '',
            'Días solicitados': s.cantidadDias,
            'Primer día': s.dias[0]?.toISOString().slice(0, 10) ?? '',
            Backup: s.backupNombre ?? '',
            'Motivo de rechazo': s.motivoRechazo ?? '',
            'Fecha de solicitud': s.createdAt.toISOString().slice(0, 10),
            'Fecha de resolución': s.resueltoAt ? s.resueltoAt.toISOString().slice(0, 10) : '',
        }));

        const hoja = xlsx.utils.json_to_sheet(filas);
        const libro = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(libro, hoja, 'Solicitudes');
        const buffer = xlsx.write(libro, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

        reply
            .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            .header('Content-Disposition', `attachment; filename="solicitudes_${estatus}.xlsx"`)
            .send(buffer);
    });

}