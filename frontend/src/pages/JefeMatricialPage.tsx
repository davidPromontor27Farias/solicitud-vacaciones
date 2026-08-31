import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { obtenerArbolMatricial, type NodoMatricial, type EstadoNodoMatricial } from '../api/jefe';
import { ApiError } from '../api/client';
import { useJefeAuth } from '../context/JefeAuthContext';
import {
    RefreshCw,
    AlertCircle,
    Building2,
    ChevronDown,
    ChevronRight,
    X,
} from 'lucide-react';

const GLASS = 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl';

const ESTILOS_NODO: Record<EstadoNodoMatricial, { anillo: string; punto: string; texto: string; etiqueta: string; borde: string }> = {
    vencido: { anillo: 'ring-red-400/70', punto: 'bg-red-400', texto: 'text-red-300', etiqueta: 'Vencido', borde: 'border-l-red-400' },
    critico: { anillo: 'ring-amber-400/70', punto: 'bg-amber-400', texto: 'text-amber-300', etiqueta: 'Por vencer', borde: 'border-l-amber-400' },
    vigente: { anillo: 'ring-emerald-400/70', punto: 'bg-emerald-400', texto: 'text-emerald-300', etiqueta: 'Vigente', borde: 'border-l-emerald-400' },
    sin_datos: { anillo: 'ring-white/20', punto: 'bg-white/40', texto: 'text-white/50', etiqueta: 'Sin datos', borde: 'border-l-white/20' },
};

function formatearFecha(iso: string): string {
    return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    });
}

function iniciales(nombre: string): string {
    return nombre
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join('')
        .toUpperCase();
}

function FilaArbol({
    nodo,
    nivel,
    onSeleccionar,
}: {
    nodo: NodoMatricial;
    nivel: number;
    onSeleccionar: (nodo: NodoMatricial) => void;
}) {
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
}

function PanelDetalle({ nodo, onCerrar }: { nodo: NodoMatricial; onCerrar: () => void }) {
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
}

export function JefeMatricialPage() {
    const { jefe } = useJefeAuth();
    const [arbol, setArbol] = useState<NodoMatricial | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nodoSeleccionado, setNodoSeleccionado] = useState<NodoMatricial | null>(null);

    useEffect(() => {
        if (!jefe?.tieneMatricial) {
            setCargando(false);
            return;
        }
        obtenerArbolMatricial()
            .then(setArbol)
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    }, [jefe?.tieneMatricial]);

    if (!jefe?.tieneMatricial) {
        return <Navigate to="/panel-jefe" replace />;
    }

    if (cargando) {
        return (
            <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 text-white/60 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${GLASS} p-4 rounded-xl text-red-200 flex items-center gap-2`}>
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
            </div>
        );
    }

    if (!arbol) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-white">
                <Building2 className="w-5 h-5 text-white/70" />
                <h1 className="text-lg font-semibold">Matricial</h1>
            </div>

            {nodoSeleccionado && (
                <PanelDetalle nodo={nodoSeleccionado} onCerrar={() => setNodoSeleccionado(null)} />
            )}

            <div className={`${GLASS} rounded-2xl overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-linear-to-r from-[#4a8b2c]/30 to-[#ee7624]/20 border-b border-white/20">
                                <th className="text-left px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Empleado</th>
                                <th className="text-left px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Puesto</th>
                                <th className="text-left px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Departamento</th>
                                <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Status</th>
                                <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Días</th>
                                <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Fecha límite</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            <FilaArbol nodo={arbol} nivel={0} onSeleccionar={setNodoSeleccionado} />
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
