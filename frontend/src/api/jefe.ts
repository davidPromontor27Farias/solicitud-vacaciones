import { apiFetchJefe, guardarSesionJefe, type JefeSesion } from './client';

interface LoginJefeRespuesta {
    token: string;
    jefe: JefeSesion;
}

export async function loginJefe(numeroEmpleado: string, password: string): Promise<JefeSesion> {
    const resultado = await apiFetchJefe<LoginJefeRespuesta>('/jefe/login', {
        method: 'POST',
        body: JSON.stringify({ numeroEmpleado, password }),
    });
    guardarSesionJefe(resultado.token, resultado.jefe);
    return resultado.jefe;
}

export type EstadoSaldo = 'vencido' | 'critico' | 'vigente';

export interface SaldoEquipo {
    id: string;
    diasPorLey: number;
    diasDisfrutados: number;
    diasPendientes: number;
    inicioValidez: string;
    finValidez: string;
    fechaLimiteDisfrute: string;
    diasParaVencer: number;
    estado: EstadoSaldo;
}

export interface EmpleadoEquipo {
    empleadoId: string;
    numeroEmpleado: string;
    nombre: string;
    departamento: string | null;
    puesto: string | null;
    saldos: SaldoEquipo[];
}

export function obtenerEquipo(): Promise<EmpleadoEquipo[]> {
    return apiFetchJefe('/jefe/equipo');
}

// Solo disponible si la sesión del jefe tiene accesoTotal (director general).
export function obtenerTodosLosDepartamentos(): Promise<EmpleadoEquipo[]> {
    return apiFetchJefe('/jefe/todos-los-departamentos');
}

export type EstadoNodoMatricial = 'vencido' | 'critico' | 'vigente' | 'sin_datos';

export interface NodoMatricial {
    empleadoId: string;
    numeroEmpleado: string;
    nombre: string;
    puesto: string | null;
    departamento: string | null;
    estado: EstadoNodoMatricial;
    diasPendientes: number;
    fechaLimiteDisfrute: string | null;
    hijos: NodoMatricial[];
}

// Solo disponible si la sesión del jefe tiene tieneMatricial (subordinados directos o
// matriciales): su propia piramide jerárquica en forma de árbol, no toda la empresa.
export function obtenerArbolMatricial(): Promise<NodoMatricial> {
    return apiFetchJefe('/jefe/matricial');
}

export interface VacacionAprobadaEquipo {
    solicitudId: string;
    empleadoId: string;
    empleadoNombre: string;
    dias: string[];
}

// Vacaciones ya aprobadas de los subordinados directos y matriciales del jefe: para
// llevar control de quien tiene vacaciones encima, y desde donde se pueden revocar.
export function obtenerVacacionesEquipo(): Promise<VacacionAprobadaEquipo[]> {
    return apiFetchJefe('/jefe/vacaciones-equipo');
}

export interface RevocarVacacionResultado {
    id: string;
    estatus: string;
    diasActivos: string[];
}

// dias: si se omite, se revoca todo el periodo activo. Si se especifica, solo esos dias
// (ej. de 5 dias solicitados, revocar solo los 2 que aun no han pasado).
export function revocarVacacionEquipo(solicitudId: string, motivo: string, dias?: string[]): Promise<RevocarVacacionResultado> {
    return apiFetchJefe(`/jefe/vacaciones-equipo/${solicitudId}/revocar`, {
        method: 'POST',
        body: JSON.stringify({ motivo, dias }),
    });
}

export interface NotificacionSolicitud {
    solicitudId: string;
    empleadoNombre: string;
    dias: string[];
    createdAt: string;
    enlaceToken: string;
}

// enlaceToken lleva a /revisar/:token, la misma pantalla que abre el enlace del correo.
export function obtenerNotificacionesJefe(): Promise<NotificacionSolicitud[]> {
    return apiFetchJefe('/jefe/notificaciones');
}
