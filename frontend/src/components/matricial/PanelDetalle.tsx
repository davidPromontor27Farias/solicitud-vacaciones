import { X } from 'lucide-react';
import { GLASS } from '../../utils/estilos';
import { ESTILOS_NODO, formatearFecha, iniciales } from './utils';
import type { NodoMatricial } from '../../api/jefe';

export const PanelDetalle = ({ nodo, onCerrar }: { nodo: NodoMatricial; onCerrar: () => void }) => {
    const estilo = ESTILOS_NODO[nodo.estado];
    return (
        <div className={`${GLASS} rounded-2xl p-5`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-semibold bg-white/15 text-white ring-2 ${estilo.anillo}`}>
                        {iniciales(nodo.nombre)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-white font-bold leading-snug truncate">{nodo.nombre}</p>
                        <p className="text-sm text-white/60">{nodo.puesto || 'Sin puesto'} · #{nodo.numeroEmpleado}</p>
                    </div>
                </div>
                <button type="button" onClick={onCerrar} className="text-white/50 hover:text-white cursor-pointer shrink-0">
                    <X size={18} />
                </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 mt-4 border-t border-white/10 text-sm">
                <div>
                    <p className="text-[11px] text-white/40 uppercase tracking-wide">Departamento</p>
                    <p className="text-white/90 truncate">{nodo.departamento || 'Sin departamento'}</p>
                </div>
                <div>
                    <p className="text-[11px] text-white/40 uppercase tracking-wide">Status</p>
                    <p className={`font-semibold flex items-center gap-1.5 ${estilo.texto}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${estilo.punto}`} />
                        {estilo.etiqueta}
                    </p>
                </div>
                <div>
                    <p className="text-[11px] text-white/40 uppercase tracking-wide">Días</p>
                    <p className={`font-semibold ${estilo.texto}`}>{nodo.estado === 'sin_datos' ? '—' : nodo.diasPendientes}</p>
                </div>
                <div>
                    <p className="text-[11px] text-white/40 uppercase tracking-wide">Fecha límite</p>
                    <p className="text-white/90">{nodo.fechaLimiteDisfrute ? formatearFecha(nodo.fechaLimiteDisfrute) : '—'}</p>
                </div>
            </div>
            {nodo.hijos.length > 0 && (
                <p className="text-xs text-white/40 mt-3">{nodo.hijos.length} {nodo.hijos.length === 1 ? 'persona reporta' : 'personas reportan'} directamente a {nodo.nombre.split(' ')[0]}.</p>
            )}
        </div>
    );
};
