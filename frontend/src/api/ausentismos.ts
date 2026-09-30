import { apiFetch } from "./client";



export type MotivoAusentismo =
    | 'permiso_sin_goce'
    | 'permiso_con_goce'
    | 'home_office'
    | 'tiempo_por_tiempo'
    | 'permiso_interno_salud'
    | 'permiso_salida'
    | 'permiso_entrada';

export const MOTIVOS_AUSENTISMO: { value: MotivoAusentismo; label: string }[] = [
    { value: 'permiso_sin_goce', label: 'Permiso sin goce de sueldo' },
    { value: 'permiso_con_goce', label: 'Permiso con goce de sueldo' },
    { value: 'home_office', label: 'Home office' },
    { value: 'tiempo_por_tiempo', label: 'Tiempo por tiempo' },
    { value: 'permiso_interno_salud', label: 'Permiso interno (por salud laboral)' },
    { value: 'permiso_salida', label: 'Permiso de salida' },
    { value: 'permiso_entrada', label: 'Permiso de entrada' },
]

export type EstatusAusentismo = 'pendiente' | 'aprobado' | 'rechazado';

export interface AusentismoResumen {
    id: string;
    motivo: MotivoAusentismo;
    comentario: string;
    dias: string[];
    estatus: EstatusAusentismo;
    motivoRechazo: string | null;
    createdAt: string;
    resueltoAt: string | null;
}

export interface HistorialAusentismoResultado {
    datos: AusentismoResumen[];
    total: number;
    pagina: number;
    porPagina: number;
}

export function crearAusentismo(motivo: MotivoAusentismo, comentario: string, dias: string[]): Promise<{ id: string; estatus: string }> {
    return apiFetch('/ausentismos', {
        method: 'POST',
        body: JSON.stringify({ motivo, comentario, dias }),
    });
}

export function obtenerMisAusentismos(pagina = 1, porPagina = 10): Promise<HistorialAusentismoResultado> {
    return apiFetch(`/ausentismos/mios?pagina=${pagina}&porPagina=${porPagina}`);
}
