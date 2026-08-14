import { useEffect, useState } from 'react';
import {
  Calendar,
  User,
  Mail,
  Building2,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  UserCheck,
  FileText,
  History
} from 'lucide-react';
import { crearSolicitud, obtenerMisSolicitudes, type SolicitudResumen } from '../api/solicitudes';
import { obtenerPerfil, type PerfilEmpleado } from '../api/empleados';
import { ApiError } from '../api/client';
import { SelectorDias } from '../components/SelectorDias';
import { formatearDiasComoRangos, formatearFecha } from '../utils/fechas';
import { dividirNombres } from '../utils/texto';


const ESTADO_SALDO_ESTILOS: Record<string, { bg: string; text: string; label: string }> = {
  disponible: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'Disponible' },
  proximo: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Próximo a liberar' },
  vencido: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Vencido' },
};

const ESTATUS_ESTILOS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pendiente: {
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-700',
    icon: <Clock className="w-4 h-4" />
  },
  aprobada: {
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
    icon: <CheckCircle className="w-4 h-4" />
  },
  rechazada: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    icon: <XCircle className="w-4 h-4" />
  },
  revocada: {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
    icon: <RefreshCw className="w-4 h-4" />
  },
};

type TabId = 'informacion' | 'nueva' | 'mis';

const TABS: { id: TabId; label: string }[] = [
  { id: 'informacion', label: 'Información' },
  { id: 'nueva', label: 'Nueva solicitud' },
  { id: 'mis', label: 'Mis solicitudes' },
];

export function DashboardPage() {
  const [tabActivo, setTabActivo] = useState<TabId>('informacion');
  const [perfil, setPerfil] = useState<PerfilEmpleado | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);

  const [solicitudes, setSolicitudes] = useState<SolicitudResumen[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState<string | null>(null);

  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [exitoForm, setExitoForm] = useState<string |null>(null);
  const [enviando, setEnviando] = useState(false);


  async function cargarPerfil() {
    setCargandoPerfil(true);
    setErrorPerfil(null);
    try {
      const p = await obtenerPerfil();
      setPerfil(p);
    } catch (err) {
      setErrorPerfil(err instanceof ApiError ? err.message : 'Error inesperado');
    } finally {
      setCargandoPerfil(false);
    }
  }

  async function cargarHistorial() {
    setCargandoLista(true);
    setErrorLista(null);
    try {
      const resultado = await obtenerMisSolicitudes();
      setSolicitudes(resultado.datos);
    } catch (err) {
      setErrorLista(err instanceof ApiError ? err.message : 'Error inesperado');
    } finally {
      setCargandoLista(false);
    }
  }

  useEffect(() => {
    cargarPerfil();
    cargarHistorial();
  }, []);

  useEffect(() => {
    function alRecuperarFoco() {
      if (document.visibilityState === 'visible') {
        cargarPerfil();
        cargarHistorial();
      }
    }
    document.addEventListener('visibilitychange', alRecuperarFoco);
    window.addEventListener('focus', alRecuperarFoco);
    return () => {
      document.removeEventListener('visibilitychange', alRecuperarFoco);
      window.removeEventListener('focus', alRecuperarFoco);
    };
  }, []);

  async function manejarCrear() {
    setErrorForm(null);
    setExitoForm(null);
    if (diasSeleccionados.length === 0) {
      setErrorForm('Selecciona al menos un día en el calendario');
      return;
    }
    setEnviando(true);
    try {
      await crearSolicitud(diasSeleccionados);
      setDiasSeleccionados([]);
      await Promise.all([cargarHistorial(), cargarPerfil()]);
      setExitoForm('Solicitud enviada correctamente');
      setTimeout(() => setTabActivo('mis'), 1200);
    } catch (err) {
      setErrorForm(err instanceof ApiError ? err.message : 'Error inesperado');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-lg border border-gray-100 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTabActivo(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              tabActivo === tab.id
                ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabActivo === 'informacion' && (
        <div className='spcae-y-6 transition-opacity duration-300 starting:opacity-0'>
            {/* Perfil Header */}
            <section className="bg-gradient-to-right from-[#4a8b2c] to-[#ee7624] p-5 sm:p-8 rounded-2xl shadow-lg text-white">
                <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-4 rounded-full">
                    <User className="w-12 h-12" />
                    </div>
                    {cargandoPerfil ? (
                    <p className="text-lg">Cargando perfil...</p>
                    ) : errorPerfil ? (
                    <p className="text-lg text-red-200">{errorPerfil}</p>
                    ) : perfil && (
                    <div>
                        <h2 className="text-2xl font-bold">{perfil.nombre}</h2>
                        <p className="text-white/80 text-sm">{perfil.puesto || 'Sin puesto'}</p>
                    </div>
                    )}
                </div>
                {perfil && (
                    <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-sm opacity-80">#</span>
                    <span className="font-mono font-bold">{perfil.numeroEmpleado}</span>
                    </div>
                )}
                </div>

                {perfil && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
                    <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 opacity-80" />
                    <div>
                        <p className="text-xs opacity-80">Sociedad</p>
                        <p className="text-sm font-medium">{perfil.sociedad || '—'}</p>
                    </div>
                    </div>
                    <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 opacity-80" />
                    <div>
                        <p className="text-xs opacity-80">Departamento</p>
                        <p className="text-sm font-medium">{perfil.departamento || '—'}</p>
                    </div>
                    </div>
                    <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 opacity-80" />
                    <div>
                        <p className="text-xs opacity-80">Jefe directo</p>
                        <p className="text-sm font-medium">{perfil.jefeDirecto?.nombre || '—'}</p>
                    </div>
                    </div>
                    <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 opacity-80" />
                    <div>
                        <p className="text-xs opacity-80">Correo</p>
                        <p className="text-sm font-medium truncate">{perfil.correoPersonal || '—'}</p>
                    </div>
                    </div>
                </div>
                )}
            </section>

            {/* Saldo de Vacaciones */}
            <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-[#4a8b2c]/10 rounded-lg">
                    <CalendarDays className="w-5 h-5 text-[#4a8b2c]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Saldo de Vacaciones</h2>
                </div>

                {perfil ? (
                <div className='transition-opacity duration-300 starting:opacity-0'>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-linear-to-br from-[#4a8b2c]/5 to-[#4a8b2c]/10 p-4 rounded-xl border border-[#4a8b2c]/20">
                        <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Días disponibles</span>
                        <TrendingUp className="w-5 h-5 text-[#4a8b2c]" />
                        </div>
                        <p className="text-3xl font-bold text-[#4a8b2c] mt-2">{perfil.totalPendientes}</p>
                    </div>
                    <div className="bg-linear-to-br from-[#ee7624]/5 to-[#ee7624]/10 p-4 rounded-xl border border-[#ee7624]/20">
                        <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Días ocupados</span>
                        <TrendingDown className="w-5 h-5 text-[#ee7624]" />
                        </div>
                        <p className="text-3xl font-bold text-[#ee7624] mt-2">{perfil.totalDisfrutados}</p>
                    </div>
                    </div>

                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="text-gray-500 text-xs">
                            <th className="font-medium py-2 pr-4 text-left">Periodo</th>
                            <th className="font-medium py-2 pr-4 text-left">Días por ley</th>
                            <th className="font-medium py-2 pr-4 text-left">Disfrutados</th>
                            <th className="font-medium py-2 pr-4 text-left">Pendientes</th>
                            <th className="font-medium py-2 pr-4 text-left">Disponible desde</th>
                            <th className="font-medium py-2 pr-4 text-left">Fecha límite</th>
                            <th className="font-medium py-2 text-left">Estado</th>
                        </tr>
                        </thead>
                        <tbody>
                        {perfil.saldos.map((s, i) => {
                            const estadoEstilo = ESTADO_SALDO_ESTILOS[s.estado];
                            return (
                            <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="py-2 pr-4 text-gray-600">{s.anioInicio}-{s.anioFin}</td>
                            <td className="py-2 pr-4 font-medium">{s.diasPorLey}</td>
                            <td className="py-2 pr-4 text-gray-600">{s.diasDisfrutados}</td>
                            <td className="py-2 pr-4 text-[#4a8b2c] font-medium">{s.diasPendientes}</td>
                            <td className="py-2 pr-4 text-gray-600">{s.inicioValidez}</td>
                            <td className="py-2 pr-4 text-gray-600">{formatearFecha(s.fechaLimiteDisfrute)}</td>
                            <td className="py-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${estadoEstilo.bg} ${estadoEstilo.text}`}>
                                {estadoEstilo.label}
                                </span>
                            </td>
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                    </div>
                </div>
                ) : (
                <p className="text-gray-500">Cargando saldo...</p>
                )}
            </section>
        </div>
      )}

      {tabActivo === 'nueva' && (
      <div className='spcae-y-6 transition-opacity duration-300 starting:opacity-0'>
        {/* Nueva Solicitud */}
        {perfil && perfil.totalPendientes > 0 ? (
            <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-[#ee7624]/10 rounded-lg">
                <Plus className="w-5 h-5 text-[#ee7624]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Nueva Solicitud de Vacaciones</h2>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                <SelectorDias seleccionados={diasSeleccionados} onChange={setDiasSeleccionados} />
                </div>
                <div className="lg:w-80 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">Días seleccionados</p>
                    <p className='text-lg font-medium text-gray-900 mt-1'>
                        {diasSeleccionados.length > 0 ? (
                            <span className='text-[#4a8b2c]'>
                                {formatearDiasComoRangos(diasSeleccionados)}
                                <span className='text-gray-400 font-normal text-sm ml-1'>
                                    ({diasSeleccionados.length} día{diasSeleccionados.length > 1 ? 's' : ''})
                                </span>
                            </span>
                        ) : (
                            <span className='text-gray-400 text-sm'>Ninguno</span>
                        )}
                    </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700">
                    No puedes seleccionar domingos ni días que ya pasaron.
                    </p>
                </div>

                {exitoForm && (
                    <div className="bg-green-50 p-3 rounded-xl flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{exitoForm}</span>
                    </div>
                )}

                {errorForm && (
                    <div className="bg-red-50 p-3 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{errorForm}</span>
                    </div>
                )}

                <button
                    type="button"
                    onClick={manejarCrear}
                    disabled={enviando}
                    className="w-full bg-gradient-to-br from-[#4a8b2c] to-[#ee7624] text-white rounded-xl px-6 py-3 text-sm font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
                >
                    {enviando ? (
                    <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Enviando...
                    </span>
                    ) : (
                    <span className="flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Solicitar Vacaciones
                    </span>
                    )}
                </button>
                </div>
            </div>
            </section>
        ) : (
            perfil && (
            <section className="bg-gray-50 p-8 rounded-2xl border border-gray-200 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No tienes días disponibles para solicitar vacaciones.</p>
            </section>
            )
        )}
      </div>
      )}

      {tabActivo === 'mis' && (
      <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#4a8b2c]/10 rounded-lg">
              <History className="w-5 h-5 text-[#4a8b2c]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Mis Solicitudes</h2>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {solicitudes.length} solicitudes
          </span>
        </div>

        {cargandoLista ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : errorLista ? (
          <div className="bg-red-50 p-4 rounded-xl text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{errorLista}</span>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Todavía no tienes solicitudes.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {solicitudes.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                <div>
                  <p className="text-sm text-gray-900 font-medium">{formatearDiasComoRangos(s.dias)}</p>
                  {s.backupNombre && (
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Backup:
                      </span>
                      {dividirNombres(s.backupNombre).length > 1 ? (
                        <ul className="list-disc list-inside ml-4">
                          {dividirNombres(s.backupNombre).map((nombre, idx) => (
                            <li key={idx}>{nombre}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="ml-4">{s.backupNombre}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${ESTATUS_ESTILOS[s.estatus].bg}`}>
                  {ESTATUS_ESTILOS[s.estatus].icon}
                  <span className={`text-xs font-medium ${ESTATUS_ESTILOS[s.estatus].text}`}>
                    {s.estatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      )}
    </div>
  );
}