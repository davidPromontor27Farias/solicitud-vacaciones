import { useEffect, useMemo, useState } from 'react';
import {
    obtenerEquipo,
    obtenerVacacionesEquipo,
    revocarVacacionEquipo,
    type EmpleadoEquipo,
    type VacacionAprobadaEquipo,
} from '../api/jefe';
import { ApiError } from '../api/client';
import { formatearFecha } from '../utils/fechas';
import {
    RefreshCw,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    CalendarCheck,
    X,
} from 'lucide-react';

const GLASS = 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl';
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function fechaISO(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
}

function hoyISO(): string {
    const ahora = new Date();
    return fechaISO(new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())));
}

function obtenerMatrizMes(anio: number, mes: number): Date[][] {
    const primerDia = new Date(Date.UTC(anio, mes, 1));
    const ultimoDia = new Date(Date.UTC(anio, mes + 1, 0));
    const offsetInicio = (primerDia.getUTCDay() + 6) % 7; // lunes = 0

    const dias: Date[] = [];
    for (let i = offsetInicio; i > 0; i--) {
        dias.push(new Date(Date.UTC(anio, mes, 1 - i)));
    }
    for (let d = 1; d <= ultimoDia.getUTCDate(); d++) {
        dias.push(new Date(Date.UTC(anio, mes, d)));
    }
    while (dias.length % 7 !== 0) {
        const ultimo = dias[dias.length - 1];
        dias.push(new Date(Date.UTC(ultimo.getUTCFullYear(), ultimo.getUTCMonth(), ultimo.getUTCDate() + 1)));
    }

    const semanas: Date[][] = [];
    for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
    return semanas;
}

interface CriticoResumen {
    empleadoId: string;
    nombre: string;
    estado: 'vencido' | 'critico';
    diasPendientes: number;
    diasParaVencer: number;
    fechaLimiteDisfrute: string;
}

function calcularCriticos(equipo: EmpleadoEquipo[]): CriticoResumen[] {
    const resultado: CriticoResumen[] = [];
    for (const empleado of equipo) {
        const urgente = empleado.saldos.find((s) => s.estado === 'vencido') ?? empleado.saldos.find((s) => s.estado === 'critico');
        if (!urgente) continue;
        resultado.push({
            empleadoId: empleado.empleadoId,
            nombre: empleado.nombre,
            estado: urgente.estado as 'vencido' | 'critico',
            diasPendientes: urgente.diasPendientes,
            diasParaVencer: urgente.diasParaVencer,
            fechaLimiteDisfrute: urgente.fechaLimiteDisfrute,
        });
    }
    return resultado.sort((a, b) => {
        if (a.estado !== b.estado) return a.estado === 'vencido' ? -1 : 1;
        return a.diasParaVencer - b.diasParaVencer;
    });
}

function ModalRevocar({
    vacacion,
    onCerrar,
    onRevocado,
}: {
    vacacion: VacacionAprobadaEquipo;
    onCerrar: () => void;
    onRevocado: () => void;
}) {
    const diasOrdenados = useMemo(() => [...vacacion.dias].sort(), [vacacion.dias]);
    const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set(diasOrdenados));
    const [motivo, setMotivo] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function alternar(dia: string) {
        setSeleccionados((prev) => {
            const siguiente = new Set(prev);
            if (siguiente.has(dia)) siguiente.delete(dia);
            else siguiente.add(dia);
            return siguiente;
        });
    }

    async function confirmar() {
        if (seleccionados.size === 0) {
            setError('Selecciona al menos un día');
            return;
        }
        if (!motivo.trim()) {
            setError('Indica el motivo de la revocación');
            return;
        }
        setEnviando(true);
        setError(null);
        try {
            await revocarVacacionEquipo(vacacion.solicitudId, motivo.trim(), [...seleccionados].sort());
            onRevocado();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCerrar}>
            <div
                className="bg-gray-600 border border-white/20 shadow-2xl rounded-2xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        
                        Revocar vacaciones
                    </h2>
                    <button type="button" onClick={onCerrar} className="text-white/50 hover:text-white cursor-pointer">
                        <X size={18} />
                    </button>
                </div>
                <p className="text-sm text-white/60 mb-4">{vacacion.empleadoNombre}</p>

                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/50 uppercase tracking-wide">
                        Días aprobados ({diasOrdenados.length})
                    </p>
                    <button
                        type="button"
                        onClick={() => setSeleccionados(seleccionados.size === diasOrdenados.length ? new Set() : new Set(diasOrdenados))}
                        className="text-xs text-white/70 hover:text-white cursor-pointer underline"
                    >
                        {seleccionados.size === diasOrdenados.length ? 'Ninguno' : 'Todos'}
                    </button>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/10 max-h-52 overflow-y-auto mb-4">
                    {diasOrdenados.map((dia) => (
                        <label
                            key={dia}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-white/90 cursor-pointer hover:bg-white/10"
                        >
                            <input
                                type="checkbox"
                                checked={seleccionados.has(dia)}
                                onChange={() => alternar(dia)}
                                className="accent-[#4a8b2c] w-4 h-4 cursor-pointer"
                            />
                            {formatearFecha(dia)}
                            {dia < hoyISO() && <span className="text-[10px] text-white/40">ya pasó</span>}
                        </label>
                    ))}
                </div>

                <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={2}
                    placeholder="Motivo de la revocación"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 mb-3"
                />

                {error && <p className="text-sm text-red-300 mb-3">{error}</p>}

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCerrar}
                        disabled={enviando}
                        className={`${GLASS} flex-1 py-2 rounded-xl text-sm text-white/80 hover:bg-white/20 cursor-pointer disabled:opacity-50`}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={confirmar}
                        disabled={enviando}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 text-sm font-medium disabled:opacity-50 cursor-pointer"
                    >
                        {enviando && <RefreshCw size={14} className="animate-spin" />}
                        Revocar {seleccionados.size} día{seleccionados.size !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function JefeCalendarioPage() {
    const [equipo, setEquipo] = useState<EmpleadoEquipo[]>([]);
    const [vacaciones, setVacaciones] = useState<VacacionAprobadaEquipo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [vacacionSeleccionada, setVacacionSeleccionada] = useState<VacacionAprobadaEquipo | null>(null);

    const ahora = new Date();
    const [anio, setAnio] = useState(ahora.getFullYear());
    const [mes, setMes] = useState(ahora.getMonth());

    function cargarDatos() {
        setCargando(true);
        setError(null);
        return Promise.all([obtenerEquipo(), obtenerVacacionesEquipo()])
            .then(([equipoRes, vacacionesRes]) => {
                setEquipo(equipoRes);
                setVacaciones(vacacionesRes);
            })
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    }

    useEffect(() => {
        cargarDatos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Los reportes matriciales no siempre vienen en obtenerEquipo() (esa lista es solo de
    // linea directa), asi que el nombre tambien se toma de la propia vacacion si hace falta.
    const nombrePorEmpleadoId = useMemo(() => {
        const mapa = new Map(equipo.map((e) => [e.empleadoId, e.nombre]));
        for (const v of vacaciones) {
            if (!mapa.has(v.empleadoId)) mapa.set(v.empleadoId, v.empleadoNombre);
        }
        return mapa;
    }, [equipo, vacaciones]);

    const criticos = useMemo(() => calcularCriticos(equipo), [equipo]);
    const estadoCriticoPorEmpleadoId = useMemo(
        () => new Map(criticos.map((c) => [c.empleadoId, c.estado])),
        [criticos],
    );

    const vacacionesPorDia = useMemo(() => {
        const mapa = new Map<string, VacacionAprobadaEquipo[]>();
        for (const v of vacaciones) {
            for (const dia of v.dias) {
                const lista = mapa.get(dia) ?? [];
                lista.push(v);
                mapa.set(dia, lista);
            }
        }
        return mapa;
    }, [vacaciones]);

    const semanas = useMemo(() => obtenerMatrizMes(anio, mes), [anio, mes]);
    const nombreMes = new Date(Date.UTC(anio, mes, 1)).toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const hoy = hoyISO();

    function cambiarMes(delta: number) {
        const nuevaFecha = new Date(Date.UTC(anio, mes + delta, 1));
        setAnio(nuevaFecha.getUTCFullYear());
        setMes(nuevaFecha.getUTCMonth());
    }

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
                            Vacaciones ya aprobadas de tu equipo — haz clic en un nombre para revocar
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
                            onClick={() => { setAnio(ahora.getFullYear()); setMes(ahora.getMonth()); }}
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

                <div className={`${GLASS} rounded-2xl overflow-hidden`}>
                    <div className="grid grid-cols-7 border-b border-white/10">
                        {DIAS_SEMANA.map((d) => (
                            <div key={d} className="text-center text-xs font-medium text-white/50 py-2">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {semanas.flatMap((semana, semanaIdx) =>
                            semana.map((dia, diaIdx) => {
                                const iso = fechaISO(dia);
                                const delMes = dia.getUTCMonth() === mes;
                                const esHoy = iso === hoy;
                                const esPasado = iso < hoy;
                                const items = vacacionesPorDia.get(iso) ?? [];

                                // Si algún empleado de vacaciones ese día es crítico (vencido o por
                                // vencer), el recuadro se resalta para que salte a la vista de inmediato.
                                const peorCriticoDelDia = items.reduce<'vencido' | 'critico' | null>((peor, v) => {
                                    const estadoEmpleado = estadoCriticoPorEmpleadoId.get(v.empleadoId) ?? null;
                                    if (estadoEmpleado === 'vencido') return 'vencido';
                                    if (estadoEmpleado === 'critico' && peor !== 'vencido') return 'critico';
                                    return peor;
                                }, null);

                                return (
                                    <div
                                        key={`${semanaIdx}-${diaIdx}`}
                                        className={`min-h-[5.5rem] p-1.5 border-b border-r border-white/5 text-left align-top ${
                                            peorCriticoDelDia === 'vencido'
                                                ? 'bg-red-500/20 ring-2 ring-inset ring-red-500/70'
                                                : peorCriticoDelDia === 'critico'
                                                    ? 'bg-orange-500/20 ring-2 ring-inset ring-orange-500/70'
                                                    : items.length > 0
                                                        ? 'bg-emerald-500/10'
                                                        : ''
                                        } ${esPasado ? 'opacity-50' : ''} ${!delMes ? 'opacity-30' : ''}`}
                                    >
                                        <span className={`text-xs inline-flex items-center justify-center w-5 h-5 rounded-full ${esHoy ? 'bg-[#4a8b2c] text-white font-semibold' : 'text-white/70'}`}>
                                            {dia.getUTCDate()}
                                        </span>
                                        <div className="mt-1 space-y-0.5">
                                            {items.slice(0, 3).map((v) => {
                                                const estadoP = estadoCriticoPorEmpleadoId.get(v.empleadoId);
                                                return (
                                                    <button
                                                        key={v.solicitudId}
                                                        type="button"
                                                        title="Ver / revocar esta solicitud"
                                                        onClick={() => setVacacionSeleccionada(v)}
                                                        className={`w-full text-left text-[10px] rounded px-1 py-0.5 truncate cursor-pointer hover:brightness-110 ${
                                                            estadoP === 'vencido'
                                                                ? 'bg-red-500/40 text-white font-medium'
                                                                : estadoP === 'critico'
                                                                    ? 'bg-orange-500/40 text-white font-medium'
                                                                    : 'bg-emerald-500/25 text-emerald-100'
                                                        }`}
                                                    >
                                                        {nombrePorEmpleadoId.get(v.empleadoId) ?? '—'}
                                                    </button>
                                                );
                                            })}
                                            {items.length > 3 && (
                                                <div className="text-[10px] text-white/50">+{items.length - 3} más</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }),
                        )}
                    </div>
                </div>
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
