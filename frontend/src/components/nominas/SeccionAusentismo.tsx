import { RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAusentismosPorEstatus } from '../../hooks/useAusentismosPorEstatus';
import { GLASS } from './estilos';

const ETIQUETAS_MOTIVO: Record<string, string> = {
    permiso_sin_goce: 'Permiso sin goce de sueldo',
    permiso_con_goce: 'Permiso con goce de sueldo',
    home_office: 'Home office',
    tiempo_por_tiempo: 'Tiempo por tiempo',
    permiso_interno_salud: 'Permiso interno (por salud laboral)',
    permiso_salida: 'Permiso de salida',
    permiso_entrada: 'Permiso de entrada',
};

const TABS: { id: 'pendiente' | 'aprobado' | 'rechazado'; label: string }[] = [
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'aprobado', label: 'Aprobados' },
    { id: 'rechazado', label: 'Rechazados' },
];

const formatearFecha = (iso: string | null): string => {
    if (!iso) return '—';
    return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    });
};

export const SeccionAusentismos = () => {
    const { estatus, setEstatus, pagina, setPagina, datos, cargando, error, totalPaginas } = useAusentismosPorEstatus();

    return (
        <div className="space-y-4">
            <div className={`flex gap-2 ${GLASS} p-1.5 rounded-2xl w-fit`}>
                {TABS.map((tab) => (
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
                    <p className="text-white/60 text-sm">No hay ausentismos {TABS.find((t) => t.id === estatus)?.label.toLowerCase()}.</p>
                </div>
            )}

            {!cargando && !error && datos.length > 0 && (
                <div className={`${GLASS} rounded-2xl overflow-hidden`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wide">
                                    <th className="text-left px-5 py-3">Empleado</th>
                                    <th className="text-left px-5 py-3">Motivo</th>
                                    <th className="text-left px-5 py-3">Días</th>
                                    <th className="text-left px-5 py-3">Comentario</th>
                                    <th className="text-left px-5 py-3">Solicitado</th>
                                    <th className="text-left px-5 py-3">Resuelto</th>
                                    {estatus === 'rechazado' && <th className="text-left px-5 py-3">Motivo rechazo</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {datos.map((a) => (
                                    <tr key={a.id} className="text-white/90">
                                        <td className="px-5 py-3">
                                            <div>{a.nombre}</div>
                                            <div className="text-xs text-white/40">#{a.numeroEmpleado}</div>
                                        </td>
                                        <td className="px-5 py-3 text-white/70">{ETIQUETAS_MOTIVO[a.motivo] ?? a.motivo}</td>
                                        <td className="px-5 py-3">{a.cantidadDias}</td>
                                        <td className="px-5 py-3 text-white/70 max-w-xs truncate" title={a.comentario}>{a.comentario}</td>
                                        <td className="px-5 py-3 text-white/70">{formatearFecha(a.createdAt)}</td>
                                        <td className="px-5 py-3 text-white/70">{formatearFecha(a.resueltoAt)}</td>
                                        {estatus === 'rechazado' && (
                                            <td className="px-5 py-3 text-white/70">{a.motivoRechazo ?? '—'}</td>
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
                    <button type="button" onClick={() => setPagina((p) => p - 1)} disabled={pagina === 1}
                        className={`${GLASS} p-1.5 rounded-lg text-white/70 hover:bg-white/20 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed`}>
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-white/60 text-xs">Página {pagina} de {totalPaginas}</span>
                    <button type="button" onClick={() => setPagina((p) => p + 1)} disabled={pagina === totalPaginas}
                        className={`${GLASS} p-1.5 rounded-lg text-white/70 hover:bg-white/20 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed`}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};