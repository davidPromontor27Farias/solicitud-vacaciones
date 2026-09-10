

import { RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSolicitudesPorEstatus } from '../../hooks/useSolicitudesPorEstatus';
import { ESTATUS_TABS } from './constantes';
import { GLASS } from './estilos';

const formatearFecha = (iso: string | null): string => {
    if (!iso) return '—';
    return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    });
};

export const SeccionSolicitudes = () => {
    const { estatus, setEstatus, pagina, setPagina, datos, cargando, error, totalPaginas } = useSolicitudesPorEstatus();

    return (
        <div className="space-y-4">
            <div className={`flex gap-2 ${GLASS} p-1.5 rounded-2xl w-fit`}>
                {ESTATUS_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setEstatus(tab.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                            estatus === tab.id
                                ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow'
                                : 'text-white/70 hover:bg-white/10'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {cargando && (
                <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-6 h-6 text-white/60 animate-spin" />
                </div>
            )}

            {!cargando && error && (
                <div className={`${GLASS} p-4 rounded-xl text-red-200 flex items-center gap-2`}>
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {!cargando && !error && datos.length === 0 && (
                <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                    <p className="text-white/60 text-sm">No hay solicitudes {ESTATUS_TABS.find((t) => t.id === estatus)?.label.toLowerCase()}.</p>
                </div>
            )}

            {!cargando && !error && datos.length > 0 && (
                <div className={`${GLASS} rounded-2xl overflow-hidden`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wide">
                                    <th className="text-left px-5 py-3">Empleado</th>
                                    <th className="text-left px-5 py-3">Departamento</th>
                                    <th className="text-left px-5 py-3">Días</th>
                                    <th className="text-left px-5 py-3">Solicitada</th>
                                    <th className="text-left px-5 py-3">Resuelta</th>
                                    {estatus === 'rechazada' && <th className="text-left px-5 py-3">Motivo</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {datos.map((s) => (
                                    <tr key={s.id} className="text-white/90">
                                        <td className="px-5 py-3">
                                            <div>{s.nombre}</div>
                                            <div className="text-xs text-white/40">#{s.numeroEmpleado}</div>
                                        </td>
                                        <td className="px-5 py-3 text-white/70">{s.departamento ?? '—'}</td>
                                        <td className="px-5 py-3">{s.cantidadDias}</td>
                                        <td className="px-5 py-3 text-white/70">{formatearFecha(s.createdAt)}</td>
                                        <td className="px-5 py-3 text-white/70">{formatearFecha(s.resueltoAt)}</td>
                                        {estatus === 'rechazada' && (
                                            <td className="px-5 py-3 text-white/70">{s.motivoRechazo ?? '—'}</td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setPagina((p) => p - 1)}
                        disabled={pagina === 1}
                        className={`${GLASS} p-1.5 rounded-lg text-white/70 hover:bg-white/20 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed`}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-white/60 text-xs">Página {pagina} de {totalPaginas}</span>
                    <button
                        type="button"
                        onClick={() => setPagina((p) => p + 1)}
                        disabled={pagina === totalPaginas}
                        className={`${GLASS} p-1.5 rounded-lg text-white/70 hover:bg-white/20 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed`}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};