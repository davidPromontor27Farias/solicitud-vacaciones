import { Building2, ChevronRight, Users } from 'lucide-react';
import { GLASS } from '../../utils/estilos';
import type { DepartamentoResumen } from './utils';

export const TarjetaDepartamento = ({ resumen, esVencido, onClick }: { resumen: DepartamentoResumen; esVencido: boolean; onClick: () => void }) => {
    const acento = esVencido ? 'border-l-red-400' : 'border-l-amber-400';
    const icono = esVencido ? 'bg-red-500/20 text-red-200' : 'bg-amber-500/20 text-amber-200';
    const numero = esVencido ? 'text-red-300' : 'text-amber-300';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`${GLASS} hover:bg-white/15 transition-colors duration-200 text-left rounded-2xl border-l-4 ${acento} p-5 cursor-pointer`}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center ${icono}`}>
                    <Building2 size={20} />
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-white leading-snug">{resumen.departamento}</p>
                    <p className="text-xs text-white/60 flex items-center gap-1">
                        <Users size={12} />
                        {resumen.empleados} {resumen.empleados === 1 ? 'empleado' : 'empleados'}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div>
                    <p className="text-[11px] text-white/40 uppercase tracking-wide">{esVencido ? 'Días vencidos' : 'Días próximos a vencer'}</p>
                    <p className={`text-2xl font-bold ${numero}`}>{resumen.totalDias}</p>
                </div>
                <ChevronRight className="text-white/40" size={20} />
            </div>
        </button>
    );
};