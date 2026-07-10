import { apiFetch } from './client';
import type { EstatusSolicitud } from './solicitudes';

export interface DetalleRevision {
    id: string;
    empleadoNombre: string;
    estatus: EstatusSolicitud;
    dias: string[];
    backupNombre: string | null;
    colisiones: Record<string, string[]>;
}

export function obtenerDetalleRevision(token: string): Promise<DetalleRevision> {
    return apiFetch(`/revision/${token}`);
}

export function aprobarPorEnlace(token: string, backupNombre: string): Promise<{ id: string; estatus: string }> {
    return apiFetch(`/revision/${token}/aprobar`, {
        method: 'POST',
        body: JSON.stringify({ backupNombre }),
    });
}

export function rechazarPorEnlace(token: string): Promise<{ id: string; estatus: string }> {
    return apiFetch(`/revision/${token}/rechazar`, { method: 'POST' });
}
