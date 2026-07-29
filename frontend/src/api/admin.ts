import { apiFetchAdmin, guardarSesionAdmin, type AdminSesion } from './client';

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
