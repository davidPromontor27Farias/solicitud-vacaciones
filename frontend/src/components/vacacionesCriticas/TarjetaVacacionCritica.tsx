


import { Building2, UserCheck } from 'lucide-react';
import { GLASS } from '../../utils/estilos';
import { formatearFecha, iniciales } from './utils';
import type { VacacionCritica } from '../../api/admin';

export const TarjetaVacacionCritica = ({ item, onClick }: { item: VacacionCritica; onClick: () => void }) => {
    const esVencido = item.estado === 'vencido';
    const acento = esVencido ? 'border-l-red-400' : 'border-l-amber-400';
    const avatar = esVencido ? 'bg-red-500/20 text-red-200' : 'bg-amber-500/20 text-amber-200';
    const numero = esVencido ? 'text-red-300' : 'text-amber-300';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`${GLASS} hover:bg-white/15 transition-colors duration-200 text-left w-full rounded-2xl border-l-4 ${acento} p-5 cursor-pointer`}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-semibold text-sm ${avatar}`}>
                    {iniciales(item.nombre)}
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-white leading-snug">{item.nombre}</p>
                    <p className="text-xs text-white/60 truncate">{item.puesto || 'Sin puesto'} · #{item.numeroEmpleado}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/60 mb-4">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 size={13} className="text-white/40 shrink-0" />
                    <span className="truncate">{item.departamento}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                    <UserCheck size={13} className="text-white/40 shrink-0" />
                    <span className="truncate">{item.jefeDirecto?.nombre ?? 'Sin jefe directo'}</span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div>
                    <p className="text-[11px] text-white/50 uppercase tracking-wide">{esVencido ? 'Días vencidos' : 'Días próximos a vencer'}</p>
                    <p className={`text-2xl font-bold ${numero}`}>{item.diasPendientes}</p>
                </div>
                <div className="text-right">
                    <p className="text-[11px] text-white/40 uppercase tracking-wide">{esVencido ? 'Venció' : 'Vence'}</p>
                    <p className="text-sm font-medium text-white/80">{formatearFecha(item.fechaVencimiento)}</p>
                </div>
            </div>
        </button>
    );
};