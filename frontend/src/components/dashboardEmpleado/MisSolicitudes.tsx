import { AlertCircle, CheckCircle, Clock, FileText, History, RefreshCw, Users, XCircle, Calendar } from 'lucide-react';
import { formatearDiasComoRangos } from '../../utils/fechas';
import { dividirNombres } from '../../utils/texto';
import type { SolicitudResumen } from '../../api/solicitudes';

const ESTATUS_ESTILOS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pendiente: {
    bg: 'bg-amber-50 border-amber-200/80',
    text: 'text-amber-700',
    icon: <Clock className="w-3.5 h-3.5 text-amber-600" />
  },
  aprobada: {
    bg: 'bg-emerald-50 border-emerald-200/80',
    text: 'text-emerald-700',
    icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
  },
  rechazada: {
    bg: 'bg-rose-50 border-rose-200/80',
    text: 'text-rose-700',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />
  },
  revocada: {
    bg: 'bg-slate-100 border-slate-200',
    text: 'text-slate-700',
    icon: <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
  },
};

export const MisSolicitudes = ({
  solicitudes,
  cargando,
  error
}: {
  solicitudes: SolicitudResumen[];
  cargando: boolean;
  error: string | null;
}) => {
  return (
    <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-1 border-b border-gray-100/60 sm:border-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#4a8b2c]/10 rounded-lg shrink-0">
            <History className="w-5 h-5 text-[#4a8b2c]" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Mis Solicitudes
          </h2>
        </div>
        <span className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-100/80 px-2.5 py-1 rounded-full whitespace-nowrap">
          {solicitudes.length} {solicitudes.length === 1 ? 'solicitud' : 'solicitudes'}
        </span>
      </div>

      {/* Estados de Carga, Error o Vacío */}
      {cargando ? (
        <div className="flex items-center justify-center py-10">
          <RefreshCw className="w-6 h-6 text-[#4a8b2c] animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-rose-50/90 border border-rose-200 p-3.5 rounded-xl text-rose-700 flex items-start gap-2.5 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="text-center py-10 px-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">Todavía no tienes solicitudes.</p>
          <p className="text-xs text-gray-400 mt-0.5">Tus peticiones de vacaciones aparecerán aquí.</p>
        </div>
      ) : (
        /* Lista de Solicitudes */
        <div className="space-y-3">
          {solicitudes.map((s) => {
            const estatusInfo = ESTATUS_ESTILOS[s.estatus] || ESTATUS_ESTILOS.pendiente;
            const backups = s.backupNombre ? dividirNombres(s.backupNombre) : [];

            return (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white hover:bg-gray-50/80 transition-all border border-gray-100 shadow-xs hover:shadow-md gap-3 active:scale-[0.99] sm:active:scale-100"
              >
                {/* Información principal de la fecha */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="w-4 h-4 text-[#4a8b2c] shrink-0 sm:hidden" />
                      <p className="text-sm text-gray-900 font-semibold truncate">
                        {formatearDiasComoRangos(s.dias)}
                      </p>
                    </div>

                    {/* Badge visible solo arriba en móvil para ahorrar espacio vertical */}
                    <div className={`sm:hidden flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold capitalize shrink-0 ${estatusInfo.bg} ${estatusInfo.text}`}>
                      {estatusInfo.icon}
                      <span>{s.estatus}</span>
                    </div>
                  </div>

                  {/* Bloque de días revocados (si aplica) */}
                  {s.estatus !== 'revocada' && s.diasRevocados.length > 0 && (
                    <div className="bg-rose-50/70 border border-rose-100 p-2 rounded-lg text-xs text-gray-600 space-y-0.5">
                      <p className="font-semibold text-rose-700">
                        {s.diasRevocados.length} día{s.diasRevocados.length !== 1 ? 's' : ''} revocado{s.diasRevocados.length !== 1 ? 's' : ''} por tu jefe:
                      </p>
                      <p className="text-gray-600 font-medium">
                        {formatearDiasComoRangos(s.diasRevocados)}
                      </p>
                    </div>
                  )}

                  {/* Bloque de Backups / Personas de Apoyo */}
                  {s.backupNombre && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <Users className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-gray-700">Backup: </span>
                        {backups.length > 1 ? (
                          <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                            {backups.map((nombre, idx) => (
                              <li key={idx} className="truncate text-gray-600">
                                {nombre}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-600 truncate">{s.backupNombre}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Badge visible en pantallas medianas y superiores */}
                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium capitalize shrink-0 self-start sm:self-center ${estatusInfo.bg} ${estatusInfo.text}`}>
                  {estatusInfo.icon}
                  <span>{s.estatus}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};