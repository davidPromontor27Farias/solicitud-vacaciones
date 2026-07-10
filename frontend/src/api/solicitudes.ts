import { apiFetch } from './client';

export type EstatusSolicitud = 'pendiente' | 'aprobada' | 'revocada' | 'rechazada';

export interface SolicitudResumen {
    id: string;
    estatus: EstatusSolicitud;
    dias: string[];
    backupNombre: string | null;
}

export interface HistorialResultado {
    datos: SolicitudResumen[];
    total: number;
    pagina: number;
    porPagina: number;
}

export function crearSolicitud(dias: string[]): Promise<SolicitudResumen> {
    return apiFetch('/solicitudes', {
        method: 'POST',
        body: JSON.stringify({ dias }),
    });
}

export function obtenerMisSolicitudes(pagina = 1, porPagina = 10): Promise<HistorialResultado> {
    return apiFetch(`/solicitudes/mias?pagina=${pagina}&porPagina=${porPagina}`);
}

export interface SolicitudEquipo {
    id: string;
    empleadoId: string;
    empleadoNombre: string | null;
    estatus: EstatusSolicitud;
    dias: string[];
}

export function obtenerSolicitudesEquipo(): Promise<SolicitudEquipo[]> {
    return apiFetch('/solicitudes/equipo');
}

export function obtenerCalendarioMiEquipo(): Promise<SolicitudEquipo[]> {
    return apiFetch('/solicitudes/mi-equipo');
}

export function aprobarSolicitud(id: string, backupNombre: string): Promise<SolicitudResumen> {
    return apiFetch(`/solicitudes/${id}/aprobar`, {
        method: 'POST',
        body: JSON.stringify({ backupNombre }),
    });
}

export function rechazarSolicitud(id: string): Promise<SolicitudResumen> {
    return apiFetch(`/solicitudes/${id}/rechazar`, { method: 'POST' });
}

export function revocarSolicitud(id: string, motivo: string): Promise<SolicitudResumen> {
    return apiFetch(`/solicitudes/${id}/revocar`, {
        method: 'POST',
        body: JSON.stringify({ motivo }),
    });
}