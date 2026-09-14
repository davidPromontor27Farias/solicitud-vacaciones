import { RefreshCw, AlertCircle, ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react';
import { GLASS } from '../utils/estilos';
import { useJefeCalendarioPage } from '../hooks/useJefeCalendarioPage';
import { CalendarioGrid } from '../components/calendarioJefe/CalendarioGrid';
import { ModalRevocar } from '../components/calendarioJefe/ModalRevocar';

export function JefeCalendarioPage() {
    const {
        cargando, error,
        vacacionSeleccionada, setVacacionSeleccionada,
        mes, semanas, nombreMes, hoy,
        nombrePorEmpleadoId, estadoCriticoPorEmpleadoId, vacacionesPorDia,
        cambiarMes, irAHoy, cargarDatos,    
    } = useJefeCalendarioPage();

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

    return (
        <div className="grid grid-cols-1">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-white capitalize">{nombreMes}</h1>
                        <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                            <CalendarCheck size={12} />
                            Vacaciones ya aprobadas de tu equipo — Si requieres revocar algun en especifico, toca el periodo en el calendario.
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => cambiarMes(-1)}
                            className={`${GLASS} p-1.5 rounded-lg text-white/70 hover:bg-white/20 cursor-pointer`}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={irAHoy}
                            className={`${GLASS} px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:bg-white/20 cursor-pointer`}
                        >
                            Hoy
                        </button>
                        <button
                            type="button"
                            onClick={() => cambiarMes(1)}
                            className={`${GLASS} p-1.5 rounded-lg text-white/70 hover:bg-white/20 cursor-pointer`}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <CalendarioGrid
                    semanas={semanas}
                    mes={mes}
                    hoy={hoy}
                    vacacionesPorDia={vacacionesPorDia}
                    estadoCriticoPorEmpleadoId={estadoCriticoPorEmpleadoId}
                    nombrePorEmpleadoId={nombrePorEmpleadoId}
                    onSeleccionarVacacion={setVacacionSeleccionada}
                />
            </div>

            {vacacionSeleccionada && (
                <ModalRevocar
                    vacacion={vacacionSeleccionada}
                    onCerrar={() => setVacacionSeleccionada(null)}
                    onRevocado={() => {
                        setVacacionSeleccionada(null);
                        cargarDatos();
                    }}
                />
            )}
        </div>
    );
}