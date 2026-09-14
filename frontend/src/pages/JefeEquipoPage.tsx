import { RefreshCw, AlertCircle, ShieldCheck, CalendarDays } from 'lucide-react';
import { GLASS } from '../utils/estilos';
import { useJefeEquipoPage } from '../hooks/useJefeEquipoPage';
import { TablaEquipo } from '../components/equipoJefe/TablaEquipo';

export function JefeEquipoPage() {
    const { equipo, cargando, error, filtro, setFiltro, empleadosFiltrados, SEMAFORO } = useJefeEquipoPage();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-white">
                <CalendarDays className="w-5 h-5 text-white/70" />
                <h1 className="text-lg font-semibold">Mi equipo</h1>
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

            {!cargando && !error && equipo.length === 0 && (
                <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                    <ShieldCheck className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                    <p className="text-white font-medium">Sin personal a cargo</p>
                </div>
            )}

            {!cargando && !error && equipo.length > 0 && (
                <div className="space-y-6">
                    <div className={`flex flex-wrap gap-2 ${GLASS} p-1.5 rounded-2xl w-fit`}>
                        {SEMAFORO.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setFiltro(s.id)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                                    filtro === s.id
                                        ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow'
                                        : 'text-white/70 hover:bg-white/10'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${s.punto}`} />
                                {s.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filtro === s.id ? 'bg-white/20' : 'bg-white/10 text-white/60'}`}>
                                    {s.cantidad}
                                </span>
                            </button>
                        ))}
                    </div>

                    {empleadosFiltrados.length === 0 ? (
                        <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                            <ShieldCheck className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                            <p className="text-white/60 text-sm">Sin registros con este filtro.</p>
                        </div>
                    ) : (
                        <TablaEquipo empleados={empleadosFiltrados} filtro={filtro} />
                    )}
                </div>
            )}
        </div>
    );
}
