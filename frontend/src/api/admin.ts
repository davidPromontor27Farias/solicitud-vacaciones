import { apiFetchAdmin, getAdminToken, guardarSesionAdmin, ApiError, type AdminSesion } from './client';

interface LoginAdminRespuesta {
    token: string;
    admin: AdminSesion;
}

export async function loginAdmin(usuario: string, password: string): Promise<AdminSesion> {
    const resultado = await apiFetchAdmin<LoginAdminRespuesta>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ usuario, password }),
    });
    guardarSesionAdmin(resultado.token, resultado.admin);
    return resultado.admin;
}

export interface VacacionCritica {
    empleadoId: string;
    numeroEmpleado: string;
    nombre: string;
    departamento: string;
    sociedad: string | null;
    puesto: string | null;
    jefeDirecto: { nombre: string } | null;
    saldoId: string;
    diasPendientes: number;
    fechaVencimiento: string;
    diasParaVencer: number;
    estado: 'vencido' | 'critico';
}

export function obtenerVacacionesCriticas(): Promise<VacacionCritica[]> {
    return apiFetchAdmin('/admin/vacaciones-criticas');
}

export async function descargarReporteVacacionesCriticas(sociedad?: string, departamento?: string): Promise<void> {
    const token = getAdminToken();
    const params = new URLSearchParams();
    if (sociedad) params.set('sociedad', sociedad);
    if (departamento) params.set('departamento', departamento);
    const query = params.toString();

    const response = await fetch(`/api/admin/reportes/vacaciones-criticas${query ? `?${query}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError(data?.error ?? 'Error inesperado', response.status, data?.detalles);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'vacaciones_vencidas_y_proximas.xlsx';
    enlace.click();
    URL.revokeObjectURL(url);
}

export interface SaldoDetalle {
    id: string;
    diasPorLey: number;
    diasDisfrutados: number;
    diasPendientes: number;
    inicioValidez: string;
    fechaVencimiento: string;
    diasParaVencer: number;
    estado: 'vencido' | 'critico' | 'vigente';
}

export interface DetalleEmpleadoAdmin {
    id: string;
    numeroEmpleado: string;
    nombre: string;
    sociedad: string | null;
    puesto: string | null;
    departamento: string | null;
    correoPersonal: string | null;
    jefeDirecto: { nombre: string } | null;
    jefeMatricial: { nombre: string } | null;
    saldos: SaldoDetalle[];
}

export function obtenerDetalleEmpleado(empleadoId: string): Promise<DetalleEmpleadoAdmin> {
    return apiFetchAdmin(`/admin/empleados/${empleadoId}`);
}

export type EstatusSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'revocada';

export interface ActualizarCorreosJefesResultado {
    actualizados: number;
    noEncontrados: string[];
}

const MENSAJE_ARCHIVO_CAMBIO = 'No se pudo leer el archivo al subirlo. Asegúrate de que el Excel esté cerrado (no abierto en edición) antes de seleccionarlo, y no lo modifiques mientras se sube. Vuelve a intentarlo.';

async function subirArchivo<T>(ruta: string, archivo: File): Promise<T> {
    const formData = new FormData();
    formData.append('file', archivo);

    const token = getAdminToken();
    let response: Response;
    try {
        response = await fetch(ruta, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: formData,
        });
    } catch {
        throw new ApiError(MENSAJE_ARCHIVO_CAMBIO, 0);
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new ApiError(data?.error ?? 'Error inesperado', response.status, data?.detalles);
    }
    return data as T;
}

export function subirCorreosJefes(archivo: File): Promise<ActualizarCorreosJefesResultado> {
    return subirArchivo('/api/admin/nomina/correos-jefes', archivo);
}

export interface ImportarReporteVacacionesResultado {
    filasLeidas: number;
    empleadosCreados: number;
    empleadosActualizados: number;
    periodosCreados: number;
    periodosActualizados: number;
    periodosEliminados: number;
    jefesNoResueltos: string[];
    filasInvalidas: string[];
}

export function subirReporteVacaciones(archivo: File): Promise<ImportarReporteVacacionesResultado> {
    return subirArchivo('/api/admin/nomina/reporte-vacaciones', archivo);
}

export interface HistorialCargaItem {
    id: string;
    tipo: 'correos_jefes' | 'reporte_vacaciones';
    nombreArchivo: string;
    adminNombre: string;
    createdAt: string;
    filasLeidas: number;
    resumen: Record<string, number>;
    avisos: string[];
}

export function obtenerHistorialCargas(): Promise<HistorialCargaItem[]> {
    return apiFetchAdmin('/admin/nomina/historial');
}

export interface SolicitudPorEstatus {
    id: string;
    empleadoId: string;
    numeroEmpleado: string;
    nombre: string;
    departamento: string | null;
    dias: string[];
    cantidadDias: number;
    backupNombre: string | null;
    motivoRechazo: string | null;
    createdAt: string;
    resueltoAt: string | null;
}

export interface ResultadoPaginado<T> {
    datos: T[];
    total: number;
    pagina: number;
    porPagina: number;
}

export function obtenerSolicitudesPorEstatus(
    estatus: EstatusSolicitud,
    pagina: number,
): Promise<ResultadoPaginado<SolicitudPorEstatus>> {
    return apiFetchAdmin(`/admin/nomina/solicitudes?estatus=${estatus}&pagina=${pagina}`);
}

export async function descargarReporteSolicitudes(estatus: EstatusSolicitud): Promise<void> {
    const token = getAdminToken();
    const response = await fetch(`/api/admin/nomina/reportes/solicitudes?estatus=${estatus}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError(data?.error ?? 'Error inesperado', response.status, data?.detalles);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `solicitudes_${estatus}.xlsx`;
    enlace.click();
    URL.revokeObjectURL(url);
}

export async function descargarReporteVacacionesPeriodo(desde: string, hasta: string): Promise<void> {
    const token = getAdminToken();
    const params = new URLSearchParams({ desde, hasta });
    const response = await fetch(`/api/admin/nomina/reportes/vacaciones-periodo?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError(data?.error ?? 'Error inesperado', response.status, data?.detalles);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `vacaciones_${desde}_a_${hasta}.xlsx`;
    enlace.click();
    URL.revokeObjectURL(url);
}
