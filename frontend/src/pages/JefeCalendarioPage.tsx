import { RefreshCw, AlertCircle, ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react';
import { GLASS } from '../utils/estilos';
import { useJefeCalendarioPage } from '../hooks/useJefeCalendarioPage';
import { CalendarioGrid } from '../components/calendarioJefe/CalendarioGrid';
import { ModalRevocar } from '../components/calendarioJefe/ModalRevocar';

export function JefeCalendarioPage() {
  const {
    cargando,
    error,
    vacacionSeleccionada,
    setVacacionSeleccionada,
    mes,
    semanas,
    nombreMes,
    hoy,
    nombrePorEmpleadoId,
    estadoCriticoPorEmpleadoId,
    vacacionesPorDia,
    cambiarMes,
    irAHoy,
    cargarDatos,
  } = useJefeCalendarioPage();

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-7 h-7 text-white/70 animate-spin" />
        <span className="text-xs text-white/60 font-medium">Cargando calendario...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${GLASS} p-4 rounded-xl text-rose-200 flex items-start sm:items-center gap-2.5 border border-rose-500/20 text-sm`}>
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0 text-rose-400" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Encabezado y Navegación de Mes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-white/10">
        {/* Título e instrucciones */}
        <div className="space-y-1">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white capitalize tracking-wide">
              {nombreMes}
            </h1>
            
            {/* Controles visibles en la misma línea en móvil super pequeño */}
            <div className="flex items-center gap-1 sm:hidden">
              <button
                type="button"
                onClick={() => cambiarMes(-1)}
                aria-label="Mes anterior"
                className={`${GLASS} p-2 rounded-lg text-white/80 active:scale-95 transition-transform`}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={irAHoy}
                className={`${GLASS} px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white/90 active:scale-95 transition-transform`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => cambiarMes(1)}
                aria-label="Mes siguiente"
                className={`${GLASS} p-2 rounded-lg text-white/80 active:scale-95 transition-transform`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <p className="text-xs text-white/60 flex items-start sm:items-center gap-1.5 leading-relaxed">
            <CalendarCheck size={14} className="shrink-0 mt-0.5 sm:mt-0 text-[#4a8b2c]" />
            <span>
              Vacaciones aprobadas. <span className="hidden sm:inline">Si requieres revocar alguna en específico, </span>toca el día o periodo para gestionar.
            </span>
          </p>
        </div>

        {/* Controles para Pantallas Medianas / Escritorio */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => cambiarMes(-1)}
            aria-label="Mes anterior"
            className={`${GLASS} p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer active:scale-95`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={irAHoy}
            className={`${GLASS} px-3.5 py-2 rounded-lg text-xs font-semibold text-white/90 hover:bg-white/20 transition-all cursor-pointer active:scale-95`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => cambiarMes(1)}
            aria-label="Mes siguiente"
            className={`${GLASS} p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer active:scale-95`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Grid del Calendario */}
      <div className="w-full overflow-hidden">
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

      {/* Modal de Revocación */}
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