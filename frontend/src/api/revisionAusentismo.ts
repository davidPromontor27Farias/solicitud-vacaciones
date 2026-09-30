import { apiFetch } from './client';

export interface DetalleRevisionAusentismo {
    id: string;
    empleadoNombre: string;
    motivo: string;
    comentario: string;
    estatus: string;
    motivoRechazo: string | null;
    dias: string[];
}

export function obtenerDetalleRevisionAusentismo(token: string): Promise<DetalleRevisionAusentismo> {
    return apiFetch(`/revision-ausentismo/${token}`);
}

export function aprobarAusentismoPorEnlace(token: string): Promise<{ id: string; estatus: string }> {
    return apiFetch(`/revision-ausentismo/${token}/aprobar`, { method: 'POST' });
}

export function rechazarAusentismoPorEnlace(token: string, motivo: string): Promise<{ id: string; estatus: string }> {
    return apiFetch(`/revision-ausentismo/${token}/rechazar`, {
        method: 'POST',
        body: JSON.stringify({ motivo }),
    });
}