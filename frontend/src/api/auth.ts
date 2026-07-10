import { apiFetch, guardarSesion, type UsuarioSesion } from './client';

export interface VerificarNumeroEmpleadoResultado {
    existe: boolean;
    requierePrimerAcceso: boolean;
}

export function verificarNumeroEmpleado(numeroEmpleado: string): Promise<VerificarNumeroEmpleadoResultado> {
    return apiFetch('/auth/verificar-numero-empleado', {
        method: 'POST',
        body: JSON.stringify({ numeroEmpleado }),
    });
}

export function registrarCorreo(numeroEmpleado: string, correo: string): Promise<{ ok: true }> {
    return apiFetch('/auth/registrar-correo', {
        method: 'POST',
        body: JSON.stringify({ numeroEmpleado, correo }),
    });
}

export function crearPassword(token: string, password: string): Promise<{ ok: true }> {
    return apiFetch('/auth/crear-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
    });
}

export function solicitarRestablecimiento(numeroEmpleado: string): Promise<{ ok: true }> {
    return apiFetch('/auth/solicitar-restablecimiento', {
        method: 'POST',
        body: JSON.stringify({ numeroEmpleado }),
    });
}

interface LoginRespuesta {
    token: string;
    empleado: UsuarioSesion;
}

export async function login(numeroEmpleado: string, password: string): Promise<UsuarioSesion> {
    const resultado = await apiFetch<LoginRespuesta>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ numeroEmpleado, password }),
    });
    guardarSesion(resultado.token, resultado.empleado);
    return resultado.empleado;
}