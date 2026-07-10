const TOKEN_KEY = 'vacaciones_token';
const USUARIO_KEY = 'vacaciones_usuario';

export interface UsuarioSesion {
    id: string;
    nombre: string;
    primerAcceso: boolean;
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getUsuarioSesion(): UsuarioSesion | null {
    const raw = localStorage.getItem(USUARIO_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function guardarSesion(token: string, usuario: UsuarioSesion): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

export function limpiarSesion(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
}

export class ApiError extends Error {
    status: number;
    detalles?: unknown;

    constructor(message: string, status: number, detalles?: unknown) {
        super(message);
        this.status = status;
        this.detalles = detalles;
    }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers as Record<string, string> | undefined),
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`/api${path}`, { ...options, headers });

    if (response.status === 204) {
        return undefined as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(data?.error ?? 'Error inesperado', response.status, data?.detalles);
    }

    return data as T;
}
