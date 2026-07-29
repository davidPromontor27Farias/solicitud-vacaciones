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

const ADMIN_TOKEN_KEY = 'vacaciones_admin_token';
const ADMIN_USUARIO_KEY = 'vacaciones_admin_usuario';

export interface AdminSesion {
    id: string;
    nombre: string;
    usuario: string;
    rol: 'lectura' | 'nominas';
}

export function getAdminToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getAdminSesion(): AdminSesion | null {
    const raw = localStorage.getItem(ADMIN_USUARIO_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function guardarSesionAdmin(token: string, admin: AdminSesion): void {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USUARIO_KEY, JSON.stringify(admin));
}

export function limpiarSesionAdmin(): void {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USUARIO_KEY);
}

export async function apiFetchAdmin<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getAdminToken();
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
