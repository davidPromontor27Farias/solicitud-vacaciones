import { useState } from 'react';
import { ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { ESTILOS_NODO, formatearFecha, iniciales } from './utils';
import type { NodoMatricial } from '../../api/jefe';

export const FilaArbol = ({
    nodo,
    nivel,
    onSeleccionar,
}: {
    nodo: NodoMatricial;
    nivel: number;
    onSeleccionar: (nodo: NodoMatricial) => void;
}) => {
    const [expandido, setExpandido] = useState(nivel === 0);
    const tieneHijos = nodo.hijos.length > 0;
    const estilo = ESTILOS_NODO[nodo.estado];

    return (
        <>
            <tr
                onClick={() => onSeleccionar(nodo)}
                className={`cursor-pointer transition-colors hover:bg-white/15 border-l-4 ${estilo.borde}`}
            >
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${nivel * 1.75}rem` }}>
                        {tieneHijos ? (
                            <button
                                type="button"
                                onClick={(evento) => {
                                    evento.stopPropagation();
                                    setExpandido((v) => !v);
                                }}
                                title={expandido ? 'Ocultar equipo' : 'Mostrar equipo'}
                                className="w-5 h-5 shrink-0 rounded-full bg-white/10 hover:bg-white/25 text-white/70 flex items-center justify-center cursor-pointer"
                            >
                                {expandido ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>
                        ) : (
                            <span className="w-5 shrink-0" />
                        )}
                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-semibold text-[10px] bg-white/15 text-white ring-2 ${estilo.anillo}`}>
                            {iniciales(nodo.nombre)}
                        </div>
                        <div className="min-w-0">
                            <p className="text-white font-medium truncate">{nodo.nombre}</p>
                            {tieneHijos && (
                                <p className="text-[11px] text-white/40">{nodo.hijos.length} {nodo.hijos.length === 1 ? 'reporte' : 'reportes'}</p>
                            )}
                        </div>
                    </div>
                </td>
                <td className="px-4 py-3 text-white/80 whitespace-nowrap">{nodo.puesto || 'Sin puesto'}</td>
                <td className="px-4 py-3 text-white/80 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                        <Building2 size={12} className="text-white/40 shrink-0" />
                        {nodo.departamento || 'Sin departamento'}
                    </span>
                </td>
                <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 ${estilo.texto}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${estilo.punto}`} />
                        {estilo.etiqueta}
                    </span>
                </td>
                <td className={`px-4 py-3 text-center font-bold ${estilo.texto}`}>
                    {nodo.estado === 'sin_datos' ? '—' : nodo.diasPendientes}
                </td>
                <td className="px-4 py-3 text-center text-white/70 whitespace-nowrap">
                    {nodo.fechaLimiteDisfrute ? formatearFecha(nodo.fechaLimiteDisfrute) : '—'}
                </td>
            </tr>
            {tieneHijos && expandido && nodo.hijos.map((hijo) => (
                <FilaArbol key={hijo.empleadoId} nodo={hijo} nivel={nivel + 1} onSeleccionar={onSeleccionar} />
            ))}
        </>
    );
};
