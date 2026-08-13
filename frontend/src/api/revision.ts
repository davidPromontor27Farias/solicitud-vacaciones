import { apiFetch } from './client';
import type { EstatusSolicitud } from './solicitudes';

export interface DetalleRevision {
    id: string;
    empleadoNombre: string;
    estatus: EstatusSolicitud;
    dias: string[];
    backupNombre: string | null;
    colisiones: Record<string, string[]>;
    diasEquipoAprobados: Record<string, string[]>;
    diasEquipoPendientes: Record<string, string[]>;
    esJefeDirecto: boolean;
    esJefeMatricial: boolean;
}

export function obtenerDetalleRevision(token: string): Promise<DetalleRevision> {
    return apiFetch(`/revision/${token}`);
}

export function aprobarPorEnlace(token: string, backupSeleccionado?: string): Promise<{ id: string; estatus: string }> {
    return apiFetch(`/revision/${token}/aprobar`, {
        method: 'POST',
        body: JSON.stringify({ backupSeleccionado }),
    });
}

export function rechazarPorEnlace(token: string, motivo: string): Promise<{ id: string; estatus: string }> {
    return apiFetch(`/revision/${token}/rechazar`, {
        method: 'POST',
        body: JSON.stringify({ motivo }),
    });
}

export function declinarPorEnlace(token: string, motivo: string): Promise<{ id: string; estatus: string }> {
    return apiFetch(`/revision/${token}/declinar`, {
        method: 'POST',
        body: JSON.stringify({ motivo }),
    });
}
