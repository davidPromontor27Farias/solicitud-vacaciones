import { useEffect, useMemo, useState } from 'react';
import { obtenerEquipo, type EmpleadoEquipo, type EstadoSaldo } from '../api/jefe';
import { ApiError } from '../api/client';
import {
    RefreshCw,
    AlertCircle,
    ShieldCheck,
    Building2,
    CalendarDays,
    ChevronLeft,
} from 'lucide-react';

const GLASS = 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl';

type FiltroSemaforo = 'todos' | EstadoSaldo;

const ESTILOS_ESTADO: Record<EstadoSaldo, { texto: string; punto: string; etiqueta: string; borde: string }> = {
    vencido: { texto: 'text-red-300', punto: 'bg-red-400', etiqueta: 'Vencido', borde: 'border-l-red-400' },
    critico: { texto: 'text-amber-300', punto: 'bg-amber-400', etiqueta: 'Por vencer', borde: 'border-l-amber-400' },
    vigente: { texto: 'text-emerald-300', punto: 'bg-emerald-400', etiqueta: 'Vigente', borde: 'border-l-emerald-400' },
};

interface EmpleadoCercano {
    empleadoId: string;
    nombre: string;
    departamento: string | null;
    dias: number;
    estado: EstadoSaldo;
    fecha: string;
}

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

// De todos los periodos de un empleado, el que este mas cerca de hoy (sin importar si
// ya vencio o esta por vencer), para mostrar un solo renglon por empleado en la tabla.
function obtenerPeriodoCercano(saldos: EmpleadoEquipo['saldos']) {
    const hoyMs = Date.now();
    return [...saldos].sort((a, b) => {
        const da = Math.abs(new Date(`${a.fechaLimiteDisfrute}T00:00:00.000Z`).getTime() - hoyMs);
        const db = Math.abs(new Date(`${b.fechaLimiteDisfrute}T00:00:00.000Z`).getTime() - hoyMs);
        return da - db;
    })[0];
}

function agruparPorEmpleado(equipo: EmpleadoEquipo[]): EmpleadoCercano[] {
    return equipo
        .filter((empleado) => empleado.saldos.length > 0)
        .map((empleado) => {
            const cercano = obtenerPeriodoCercano(empleado.saldos);
            return {
                empleadoId: empleado.empleadoId,
                nombre: empleado.nombre,
                departamento: empleado.departamento,
                dias: cercano.diasPendientes,
                estado: cercano.estado,
                fecha: cercano.fechaLimiteDisfrute,
            };
        })
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function TablaEquipo({ empleados, onSeleccionar }: { empleados: EmpleadoCercano[]; onSeleccionar: (empleadoId: string) => void }) {
    return (
        <div className={`${GLASS} rounded-2xl overflow-hidden`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-linear-to-r from-[#4a8b2c]/30 to-[#ee7624]/20 border-b border-white/20">
                            <th className="text-left px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Empleado</th>
                            <th className="text-left px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Departamento</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Días</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Status</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {empleados.map((e, indice) => {
                            const estilo = ESTILOS_ESTADO[e.estado];
                            return (
                                <tr
                                    key={e.empleadoId}
                                    onClick={() => onSeleccionar(e.empleadoId)}
                                    className={`cursor-pointer transition-colors hover:bg-white/15 border-l-4 ${estilo.borde} ${
                                        indice % 2 === 1 ? 'bg-white/5' : ''
                                    }`}
                                >
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-2.5 min-w-[11rem]">
                                            <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-semibold text-[11px] bg-white/15 text-white">
                                                {iniciales(e.nombre)}
                                            </div>
                                            <p className="text-white font-medium truncate">{e.nombre}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-white/80 whitespace-nowrap">
                                        <span className="flex items-center gap-1.5">
                                            <Building2 size={12} className="text-white/40 shrink-0" />
                                            {e.departamento || 'Sin departamento'}
                                        </span>
                                    </td>
                                    <td className={`px-4 py-3.5 text-center font-bold ${estilo.texto}`}>{e.dias}</td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 ${estilo.texto}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${estilo.punto}`} />
                                            {estilo.etiqueta}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center text-white/70 whitespace-nowrap">{formatearFecha(e.fecha)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function VistaDetalleEmpleado({ empleado, onVolver }: { empleado: EmpleadoEquipo; onVolver: () => void }) {
    const saldosOrdenados = useMemo(
        () => [...empleado.saldos].sort((a, b) => a.fechaLimiteDisfrute.localeCompare(b.fechaLimiteDisfrute)),
        [empleado.saldos],
    );

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={onVolver}
                className={`${GLASS} flex items-center gap-1.5 text-sm text-white/80 hover:bg-white/20 px-3 py-1.5 rounded-lg cursor-pointer`}
            >
                <ChevronLeft size={16} />
                Volver
            </button>

            <div className={`${GLASS} rounded-2xl p-6`}>
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center font-semibold bg-white/15 text-white text-lg">
                        {iniciales(empleado.nombre)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-lg font-bold text-white leading-snug">{empleado.nombre}</p>
                        <p className="text-sm text-white/60">{empleado.puesto || 'Sin puesto'} · #{empleado.numeroEmpleado}</p>
                        <p className="text-sm text-white/60 flex items-center gap-1.5 mt-0.5">
                            <Building2 size={13} className="text-white/40" />
                            {empleado.departamento || 'Sin departamento'}
                        </p>
                    </div>
                </div>
            </div>

            <div className={`${GLASS} rounded-2xl overflow-hidden`}>
                <div className="px-5 py-3 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white">Periodos de vacaciones ({saldosOrdenados.length})</h3>
                </div>
                {saldosOrdenados.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-white/50 text-center">Este empleado no tiene periodos registrados.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-linear-to-r from-[#4a8b2c]/30 to-[#ee7624]/20 border-b border-white/20">
                                    <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Status</th>
                                    <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Días otorgados</th>
                                    <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Días disfrutados</th>
                                    <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Días pendientes</th>
                                    <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Fecha límite</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {saldosOrdenados.map((saldo, indice) => {
                                    const estilo = ESTILOS_ESTADO[saldo.estado];
                                    return (
                                        <tr key={saldo.id} className={`border-l-4 ${estilo.borde} ${indice % 2 === 1 ? 'bg-white/5' : ''}`}>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 ${estilo.texto}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${estilo.punto}`} />
                                                    {estilo.etiqueta}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center text-white/90 font-semibold">{saldo.diasPorLey}</td>
                                            <td className="px-4 py-3.5 text-center text-white/90 font-semibold">{saldo.diasDisfrutados}</td>
                                            <td className={`px-4 py-3.5 text-center font-bold ${estilo.texto}`}>{saldo.diasPendientes}</td>
                                            <td className="px-4 py-3.5 text-center text-white/70 whitespace-nowrap">{formatearFecha(saldo.fechaLimiteDisfrute)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export function JefeEquipoPage() {
    const [equipo, setEquipo] = useState<EmpleadoEquipo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<FiltroSemaforo>('todos');
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string | null>(null);

    useEffect(() => {
        obtenerEquipo()
            .then(setEquipo)
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    }, []);

    const empleadosCercanos = useMemo(() => agruparPorEmpleado(equipo), [equipo]);
    const conVencido = empleadosCercanos.filter((e) => e.estado === 'vencido').length;
    const conCritico = empleadosCercanos.filter((e) => e.estado === 'critico').length;
    const conVigente = empleadosCercanos.filter((e) => e.estado === 'vigente').length;

    const empleadosFiltrados = filtro === 'todos' ? empleadosCercanos : empleadosCercanos.filter((e) => e.estado === filtro);
    const empleadoDetalle = empleadoSeleccionado ? equipo.find((e) => e.empleadoId === empleadoSeleccionado) ?? null : null;

    const SEMAFORO: { id: FiltroSemaforo; label: string; punto: string; cantidad: number }[] = [
        { id: 'todos', label: 'Todos', punto: 'bg-white/60', cantidad: empleadosCercanos.length },
        { id: 'vencido', label: 'Vencidos', punto: 'bg-red-400', cantidad: conVencido },
        { id: 'critico', label: 'Por vencer', punto: 'bg-amber-400', cantidad: conCritico },
        { id: 'vigente', label: 'Vigentes', punto: 'bg-emerald-400', cantidad: conVigente },
    ];

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
                    {empleadoDetalle ? (
                        <VistaDetalleEmpleado empleado={empleadoDetalle} onVolver={() => setEmpleadoSeleccionado(null)} />
                    ) : (
                        <>
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
                                <TablaEquipo empleados={empleadosFiltrados} onSeleccionar={setEmpleadoSeleccionado} />
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
