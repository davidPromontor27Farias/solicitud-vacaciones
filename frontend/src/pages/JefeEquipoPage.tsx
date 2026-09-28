import { RefreshCw, AlertCircle, ShieldCheck, Users } from 'lucide-react';
import { GLASS } from '../utils/estilos';
import { useJefeEquipoPage } from '../hooks/useJefeEquipoPage';
import { TablaEquipo } from '../components/equipoJefe/TablaEquipo';

export function JefeEquipoPage() {
  const { equipo, cargando, error, filtro, setFiltro, empleadosFiltrados, SEMAFORO } = useJefeEquipoPage();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Encabezado Principal */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-white">
          <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg shrink-0">
            <Users className="w-5 h-5 text-white/90" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-wide">Mi equipo</h1>
            <p className="text-xs text-white/60 hidden sm:block">
              Supervisa el saldo y estado de vacaciones de tu personal a cargo
            </p>
          </div>
        </div>

        {equipo.length > 0 && (
          <span className={`${GLASS} text-xs font-semibold text-white/80 px-3 py-1 rounded-full shrink-0`}>
            {equipo.length} {equipo.length === 1 ? 'colaborador' : 'colaboradores'}
          </span>
        )}
      </div>

      {/* Estado: Cargando */}
      {cargando && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="w-7 h-7 text-white/70 animate-spin" />
          <span className="text-xs text-white/60 font-medium">Cargando información del equipo...</span>
        </div>
      )}

      {/* Estado: Error */}
      {!cargando && error && (
        <div className={`${GLASS} p-4 rounded-xl text-rose-200 flex items-start sm:items-center gap-2.5 border border-rose-500/20 text-sm`}>
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5 sm:mt-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Estado: Sin personal asignado */}
      {!cargando && !error && equipo.length === 0 && (
        <div className={`${GLASS} p-8 sm:p-12 rounded-2xl text-center max-w-md mx-auto space-y-2`}>
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto opacity-90" />
          <h3 className="text-white font-semibold text-base">Sin personal a cargo</h3>
          <p className="text-xs text-white/60">No se encontraron colaboradores registrados bajo tu dirección.</p>
        </div>
      )}

      {/* Vista de Contenido Principal */}
      {!cargando && !error && equipo.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          {/* Barra de Filtros (Semáforo) con Scroll Horizontal para Móvil */}
          <div className="w-full overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            <div className={`flex items-center gap-1.5 ${GLASS} p-1.5 rounded-2xl w-max md:w-fit`}>
              {SEMAFORO.map((s) => {
                const isSelected = filtro === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFiltro(s.id)}
                    className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 select-none whitespace-nowrap ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow-lg shadow-[#4a8b2c]/20'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.punto}`} />
                    <span>{s.label}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {s.cantidad}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resultado de la Tabla o Lista filtrada */}
          {empleadosFiltrados.length === 0 ? (
            <div className={`${GLASS} p-8 rounded-2xl text-center space-y-1.5`}>
              <ShieldCheck className="w-9 h-9 text-emerald-300/80 mx-auto" />
              <p className="text-white/80 font-medium text-sm">Sin registros para este filtro</p>
              <p className="text-xs text-white/50">Prueba seleccionando otra categoría del semáforo.</p>
            </div>
          ) : (
            <div className="w-full overflow-hidden">
              <TablaEquipo empleados={empleadosFiltrados} filtro={filtro} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}