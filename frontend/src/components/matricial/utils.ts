import type { EstadoNodoMatricial } from '../../api/jefe';

export const ESTILOS_NODO: Record<EstadoNodoMatricial, { anillo: string; punto: string; texto: string; etiqueta: string; borde: string }> = {
    vencido: { anillo: 'ring-red-400/70', punto: 'bg-red-400', texto: 'text-red-300', etiqueta: 'Vencido', borde: 'border-l-red-400' },
    critico: { anillo: 'ring-amber-400/70', punto: 'bg-amber-400', texto: 'text-amber-300', etiqueta: 'Por vencer', borde: 'border-l-amber-400' },
    vigente: { anillo: 'ring-emerald-400/70', punto: 'bg-emerald-400', texto: 'text-emerald-300', etiqueta: 'Vigente', borde: 'border-l-emerald-400' },
    sin_datos: { anillo: 'ring-white/20', punto: 'bg-white/40', texto: 'text-white/50', etiqueta: 'Sin datos', borde: 'border-l-white/20' },
};

export function formatearFecha(iso: string): string {
    return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    });
}

export function iniciales(nombre: string): string {
    return nombre
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join('')
        .toUpperCase();
}
