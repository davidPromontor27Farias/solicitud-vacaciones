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

export interface Planificacion {
    id: string;
    empleadoId: string;
    fecha: string;
    nota: string | null;
}

export function obtenerPlanificacion(): Promise<Planificacion[]> {
    return apiFetchJefe('/jefe/planificacion');
}

export function crearPlanificacion(empleadoId: string, fecha: string, nota?: string): Promise<Planificacion> {
    return apiFetchJefe('/jefe/planificacion', {
        method: 'POST',
        body: JSON.stringify({ empleadoId, fecha, nota: nota || undefined }),
    });
}

export function eliminarPlanificacion(id: string): Promise<void> {
    return apiFetchJefe(`/jefe/planificacion/${id}`, { method: 'DELETE' });
}
