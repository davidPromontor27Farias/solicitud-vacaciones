import * as xlsx from "xlsx";
import ExcelJS from "exceljs";
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

    app.get('/admin/reportes/vacaciones-criticas', {preHandler: authenticateAdmin}, async (request, reply) => {
        const {sociedad, departamento} = request.query as {sociedad?: string; departamento?: string};
        const datos = await listarVacacionesCriticas.ejecutar();

        const filtrados = datos.filter(
            d => (!sociedad || d.sociedad === sociedad) && (!departamento || d.departamento === departamento)
        );

        const COLUMNAS = [
            { header: 'No. empleado', key: 'numeroEmpleado', width: 14 },
            { header: 'Nombre', key: 'nombre', width: 32 },
            { header: 'Departamento', key: 'departamento', width: 24 },
            { header: 'Sociedad', key: 'sociedad', width: 16 },
            { header: 'Puesto', key: 'puesto', width: 24 },
            { header: 'Jefe directo', key: 'jefeDirecto', width: 28 },
            { header: 'Días', key: 'dias', width: 10 },
            { header: 'Fecha límite', key: 'fecha', width: 16 },
        ];

        const construirHoja = (
            workbook: ExcelJS.Workbook,
            nombreHoja: string,
            colorHeader: string,
            etiquetaDias: string,
            etiquetaFecha: string,
            estado: 'vencido' | 'critico',
        ) => {
            const hoja = workbook.addWorksheet(nombreHoja, {
                views: [{ state: 'frozen', ySplit: 2 }],
            });

            hoja.mergeCells(1, 1, 1, COLUMNAS.length);
            const titulo = hoja.getCell(1, 1);
            titulo.value = `${nombreHoja} · ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`;
            titulo.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
            titulo.alignment = { vertical: 'middle', horizontal: 'left' };
            titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
            hoja.getRow(1).height = 26;

            COLUMNAS.forEach((columna, indice) => {
                hoja.getColumn(indice + 1).width = columna.width;
            });
            const filaEncabezado = hoja.getRow(2);
            COLUMNAS.forEach((columna, indice) => {
                const celda = filaEncabezado.getCell(indice + 1);
                celda.value = columna.key === 'dias' ? etiquetaDias : columna.key === 'fecha' ? etiquetaFecha : columna.header;
            });
            filaEncabezado.eachCell((celda) => {
                celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorHeader } };
                celda.alignment = { vertical: 'middle', horizontal: 'left' };
                celda.border = { bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
            });
            filaEncabezado.height = 20;

            const items = filtrados
                .filter((d) => d.estado === estado)
                .sort((a, b) => b.diasPendientes - a.diasPendientes);

            items.forEach((item, indice) => {
                const fila = hoja.addRow([
                    item.numeroEmpleado,
                    item.nombre,
                    item.departamento,
                    item.sociedad ?? '—',
                    item.puesto ?? '—',
                    item.jefeDirecto?.nombre ?? '—',
                    item.diasPendientes,
                    item.fechaVencimiento,
                ]);

                fila.getCell(8).numFmt = 'dd/mm/yyyy';
                fila.getCell(7).alignment = { horizontal: 'center' };
                fila.getCell(7).font = { bold: true, color: { argb: estado === 'vencido' ? 'FFB91C1C' : 'FFB45309' } };

                if (indice % 2 === 1) {
                    fila.eachCell((celda) => {
                        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
                    });
                }
                fila.eachCell((celda) => {
                    celda.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
                    celda.alignment = { ...celda.alignment, vertical: 'middle' };
                });
            });

            hoja.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: COLUMNAS.length } };

            if (items.length === 0) {
                hoja.mergeCells(3, 1, 3, COLUMNAS.length);
                const celdaVacia = hoja.getCell(3, 1);
                celdaVacia.value = 'Sin registros con estos filtros.';
                celdaVacia.font = { italic: true, color: { argb: 'FF9CA3AF' } };
            }
        };

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema de Solicitud de Vacaciones';
        workbook.created = new Date();
        construirHoja(workbook, 'Vencidos', 'FFDC2626', 'Días vencidos', 'Venció el día', 'vencido');
        construirHoja(workbook, 'Proximos a vencer', 'FFD97706', 'Días por vencer', 'Vence el día', 'critico');

        const buffer = await workbook.xlsx.writeBuffer();

        reply
            .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            .header('Content-Disposition', 'attachment; filename="vacaciones_vencidas_y_proximas.xlsx"')
            .send(buffer);
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