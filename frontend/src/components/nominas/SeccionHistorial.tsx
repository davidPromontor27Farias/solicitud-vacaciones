
import { RefreshCw, AlertCircle, Mail, FileClock } from 'lucide-react';
import { useHistorialCargas } from '../../hooks/useHistorialCargas';
import { GLASS } from './estilos';

const formatearFechaHora = (iso: string): string => {
    return new Date(iso).toLocaleString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
};

export const SeccionHistorial = () => {
    const { items, cargando, error, expandido, setExpandido, cargar } = useHistorialCargas();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-white/60 text-sm">Registro de todas las cargas hechas en este panel (correos de jefes y reporte de vacaciones). No se borran.</p>
                <button
                    type="button"
                    onClick={cargar}
                    disabled={cargando}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 cursor-pointer"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
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


            {!cargando && !error && items.length === 0 && (
                <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                    <p className="text-white/60 text-sm">Todavía no se ha hecho ninguna carga.</p>
                </div>
            )}

            {!cargando && !error && items.length > 0 && (
                <div className="space-y-2">
                    {items.map((item) => {
                        const abierto = expandido === item.id;
                        return (
                            <div key={item.id} className={`${GLASS} rounded-xl overflow-hidden`}>
                                <button
                                    type="button"
                                    onClick={() => setExpandido(abierto ? null : item.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
                                >
                                    <div className={`p-2 rounded-lg ${item.tipo === 'correos_jefes' ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`}>
                                        {item.tipo === 'correos_jefes' ? <Mail className="w-4 h-4 text-blue-300" /> : <FileClock className="w-4 h-4 text-emerald-300" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{item.nombreArchivo}</p>
                                        <p className="text-white/50 text-xs">
                                            {item.tipo === 'correos_jefes' ? 'Correos de jefes' : 'Reporte de vacaciones'} · {item.adminNombre} · {formatearFechaHora(item.createdAt)} · {item.filasLeidas} filas
                                        </p>
                                    </div>
                                    <span className="text-white/40 text-xs">{abierto ? '−' : '+'}</span>
                                </button>

                                {abierto && (
                                    <div className="px-4 pb-4 space-y-2 border-t border-white/10 pt-3">
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(item.resumen).map(([clave, valor]) => (
                                                <span key={clave} className="text-xs bg-white/5 rounded-lg px-2.5 py-1 text-white/80">
                                                    {clave}: <span className="font-semibold text-white">{valor}</span>
                                                </span>
                                            ))}
                                        </div>
                                        {item.avisos.length > 0 && (
                                            <div className="text-sm text-amber-300">
                                                <p className="font-medium mb-1">{item.avisos.length} avisos:</p>
                                                <ul className="text-white/60 text-xs space-y-0.5 max-h-32 overflow-y-auto">
                                                    {item.avisos.map((a, i) => <li key={i}>{a}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
