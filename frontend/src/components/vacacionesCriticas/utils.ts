import type { VacacionCritica } from "../../api/admin";




export const  formatearFecha  = (iso: string): string => {
    
    return new Date(`${iso.slice(0,10)}T00:00:00.000Z`).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short', 
        year: 'numeric',
        timeZone: 'UTC'
    });
}

export const iniciales = (nombre: string): string => {
    return nombre
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join('')
        .toUpperCase();
}


export interface DepartamentoResumen {
    departamento: string;
    items: VacacionCritica[];
    totalDias: number;
    empleados: number;
}

export function agruparPorDepartamento(items: VacacionCritica[]): DepartamentoResumen[] {
    const mapa = new Map<string, VacacionCritica[]>();
    for (const item of items) {
        const lista = mapa.get(item.departamento) ?? [];
        lista.push(item);
        mapa.set(item.departamento, lista);
    }
    return [...mapa.entries()]
        .map(([departamento, items]) => ({
            departamento,
            items,
            totalDias: items.reduce((acc, i) => acc + i.diasPendientes, 0),
            empleados: new Set(items.map((i) => i.empleadoId)).size,
        }))
        .sort((a, b) => b.totalDias - a.totalDias);
}

export const ESTADO_SALDO_ESTILOS: Record<'vencido' | 'critico' | 'vigente', { texto: string }> = {
    vencido: { texto: 'text-red-300' },
    critico: { texto: 'text-amber-300' },
    vigente: { texto: 'text-emerald-300' },
};