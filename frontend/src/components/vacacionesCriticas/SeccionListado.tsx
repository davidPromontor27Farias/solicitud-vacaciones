

import { useMemo } from 'react';
import { GLASS } from '../../utils/estilos';
import { formatearFecha } from './utils';
import type { VacacionCritica } from '../../api/admin';

export const SeccionListado = ({ titulo, icono, items, esVencido, onSeleccionar }: {
    titulo: string;
    icono: React.ReactNode;
    items: VacacionCritica[];
    esVencido: boolean;
    onSeleccionar: (empleadoId: string) => void;
}) => {
    const ordenados = useMemo(() => [...items].sort((a, b) => b.diasPendientes - a.diasPendientes), [items]);
    const numero = esVencido ? 'text-red-300' : 'text-amber-300';

    return (
        <div className={`${GLASS} rounded-2xl overflow-hidden`}>
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
                {icono}
                <h3 className="text-sm font-semibold text-white">{titulo}</h3>
                <span className="text-xs font-medium text-white/70 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
                    {ordenados.length}
                </span>
            </div>
            {ordenados.length === 0 ? (
                <p className="px-5 py-6 text-sm text-white/50 text-center">Sin registros con estos filtros.</p>
            ) : (
                <div className="divide-y divide-white/10">
                    {ordenados.map((item) => (
                        <button
                            key={item.saldoId}
                            type="button"
                            onClick={() => onSeleccionar(item.empleadoId)}
                            className="w-full text-left flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <div className="min-w-0">
                                <p className="text-white font-medium truncate">{item.nombre}</p>
                                <p className="text-xs text-white/50 truncate mt-0.5">
                                    {item.departamento}
                                    {item.sociedad ? ` · ${item.sociedad}` : ''}
                                    {' · Jefe: '}{item.jefeDirecto?.nombre ?? 'Sin jefe directo'}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="flex items-baseline justify-end gap-1.5 whitespace-nowrap">
                                    <span className="text-xs text-white/50">
                                        {esVencido ? 'Días vencidos:' : 'Días por vencer:'}
                                    </span>
                                    <span className={`text-lg font-bold ${numero}`}>{item.diasPendientes}</span>
                                </p>
                                <p className="flex items-baseline justify-end gap-1.5 whitespace-nowrap mt-0.5">
                                    <span className="text-[11px] text-white/50">
                                        {esVencido ? 'Venció el día:' : 'Vence el día:'}
                                    </span>
                                    <span className="text-[11px] text-white/70 font-medium">{formatearFecha(item.fechaVencimiento)}</span>
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};