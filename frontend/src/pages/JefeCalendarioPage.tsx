import { useEffect, useMemo, useState } from 'react';
import {
    obtenerEquipo,
    obtenerPlanificacion,
    crearPlanificacion,
    eliminarPlanificacion,
    type EmpleadoEquipo,
    type Planificacion,
} from '../api/jefe';
import { ApiError } from '../api/client';
import {
    RefreshCw,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Check,
    AlertTriangle,
    Clock,
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

export function JefeCalendarioPage() {
    const [equipo, setEquipo] = useState<EmpleadoEquipo[]>([]);
    const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const ahora = new Date();
    const [anio, setAnio] = useState(ahora.getFullYear());
    const [mes, setMes] = useState(ahora.getMonth());

    // Flujo: se elige un empleado (picklist o desde "Empleados críticos"), luego se van
    // marcando/desmarcando varios días en el calendario para ese empleado, y se guardan
    // todos juntos. Cambiar de empleado limpia la selección pendiente para no mezclarla.
    const [empleadoActivo, setEmpleadoActivo] = useState('');
    const [diasSeleccionados, setDiasSeleccionados] = useState<Set<string>>(new Set());
    const [notaForm, setNotaForm] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState<string | null>(null);

    function cargarDatos() {
        setCargando(true);
        setError(null);
        Promise.all([obtenerEquipo(), obtenerPlanificacion()])
            .then(([equipoRes, planificacionesRes]) => {
                setEquipo(equipoRes);
                setPlanificaciones(planificacionesRes);
            })
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    }

    useEffect(cargarDatos, []);

    const nombrePorEmpleadoId = useMemo(() => new Map(equipo.map((e) => [e.empleadoId, e.nombre])), [equipo]);
    const criticos = useMemo(() => calcularCriticos(equipo), [equipo]);
    const estadoCriticoPorEmpleadoId = useMemo(
        () => new Map(criticos.map((c) => [c.empleadoId, c.estado])),
        [criticos],
    );
    const planificacionesPorDia = useMemo(() => {
        const mapa = new Map<string, Planificacion[]>();
        for (const p of planificaciones) {
            const lista = mapa.get(p.fecha) ?? [];
            lista.push(p);
            mapa.set(p.fecha, lista);
        }
        return mapa;
    }, [planificaciones]);

    const semanas = useMemo(() => obtenerMatrizMes(anio, mes), [anio, mes]);
    const nombreMes = new Date(Date.UTC(anio, mes, 1)).toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const hoy = hoyISO();

    function cambiarMes(delta: number) {
        const nuevaFecha = new Date(Date.UTC(anio, mes + delta, 1));
        setAnio(nuevaFecha.getUTCFullYear());
        setMes(nuevaFecha.getUTCMonth());
    }

    function elegirEmpleado(id: string) {
        setEmpleadoActivo(id);
        setDiasSeleccionados(new Set());
        setNotaForm('');
        setErrorForm(null);
    }

    function alternarDia(iso: string, yaPlaneadoParaActivo: Planificacion | undefined) {
        if (!empleadoActivo) {
            setErrorForm('Primero selecciona un empleado.');
            return;
        }
        setErrorForm(null);
        if (yaPlaneadoParaActivo) {
            borrarPlanificacion(yaPlaneadoParaActivo.id);
            return;
        }
        setDiasSeleccionados((prev) => {
            const siguiente = new Set(prev);
            if (siguiente.has(iso)) siguiente.delete(iso);
            else siguiente.add(iso);
            return siguiente;
        });
    }

    async function guardarSeleccion() {
        if (!empleadoActivo || diasSeleccionados.size === 0) return;
        setGuardando(true);
        setErrorForm(null);
        const dias = [...diasSeleccionados].sort();
        const resultados = await Promise.allSettled(
            dias.map((fecha) => crearPlanificacion(empleadoActivo, fecha, notaForm.trim() || undefined)),
        );

        const creadas = resultados
            .filter((r): r is PromiseFulfilledResult<Planificacion> => r.status === 'fulfilled')
            .map((r) => r.value);
        const fallidas = resultados.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

        if (creadas.length > 0) {
            setPlanificaciones((prev) => [...prev, ...creadas]);
        }
        if (fallidas.length > 0) {
            const primerError = fallidas[0].reason;
            setErrorForm(
                `${fallidas.length} de ${dias.length} día(s) no se pudieron guardar: ${primerError instanceof ApiError ? primerError.message : 'Error inesperado'}`,
            );
        }
        setDiasSeleccionados(new Set());
        setNotaForm('');
        setGuardando(false);
    }

    async function borrarPlanificacion(id: string) {
        try {
            await eliminarPlanificacion(id);
            setPlanificaciones((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            setErrorForm(err instanceof ApiError ? err.message : 'Error inesperado');
        }
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-white capitalize">{nombreMes}</h1>
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

                <div className={`${GLASS} rounded-2xl p-4 space-y-1`}>
                    <label className="block text-xs text-white/50">Planeando días para</label>
                    <select
                        value={empleadoActivo}
                        onChange={(e) => elegirEmpleado(e.target.value)}
                        className={`w-full ${GLASS} rounded-xl px-3 py-2 text-sm text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer [&>option]:text-gray-900`}
                    >
                        <option value="">Selecciona un empleado…</option>
                        {equipo.map((e) => (
                            <option key={e.empleadoId} value={e.empleadoId}>{e.nombre}</option>
                        ))}
                    </select>
                    <p className="text-xs text-white/40 pt-1">
                        {empleadoActivo
                            ? 'Haz clic en los días del calendario para marcarlos. Vuelve a hacer clic para quitarlos.'
                            : 'Elige un empleado para poder marcar días en el calendario.'}
                    </p>
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
                                const items = planificacionesPorDia.get(iso) ?? [];
                                const planDelActivo = empleadoActivo ? items.find((p) => p.empleadoId === empleadoActivo) : undefined;
                                const otros = items.filter((p) => p.empleadoId !== empleadoActivo);
                                const estaPendiente = diasSeleccionados.has(iso);

                                // Si algún empleado con día asignado ese día es crítico (vencido o por
                                // vencer), el recuadro se resalta en rojo/naranja para que salte a la
                                // vista de inmediato, sin importar de quién sea el día en concreto.
                                const peorCriticoDelDia = items.reduce<'vencido' | 'critico' | null>((peor, p) => {
                                    const estadoEmpleado = estadoCriticoPorEmpleadoId.get(p.empleadoId) ?? null;
                                    if (estadoEmpleado === 'vencido') return 'vencido';
                                    if (estadoEmpleado === 'critico' && peor !== 'vencido') return 'critico';
                                    return peor;
                                }, null);

                                return (
                                    <button
                                        key={`${semanaIdx}-${diaIdx}`}
                                        type="button"
                                        disabled={esPasado}
                                        onClick={() => !esPasado && alternarDia(iso, planDelActivo)}
                                        title={esPasado ? 'No se pueden planear días que ya pasaron' : undefined}
                                        className={`min-h-[5.5rem] p-1.5 border-b border-r border-white/5 text-left align-top transition-colors ${
                                            esPasado
                                                ? 'opacity-25 cursor-not-allowed'
                                                : 'hover:bg-white/10 cursor-pointer'
                                        } ${
                                            peorCriticoDelDia === 'vencido'
                                                ? 'bg-red-500/20 ring-2 ring-inset ring-red-500/70'
                                                : peorCriticoDelDia === 'critico'
                                                    ? 'bg-orange-500/20 ring-2 ring-inset ring-orange-500/70'
                                                    : planDelActivo
                                                        ? 'bg-emerald-500/15 ring-1 ring-inset ring-emerald-400/60'
                                                        : ''
                                        } ${
                                            estaPendiente ? 'outline outline-2 -outline-offset-2 outline-amber-400' : ''
                                        } ${!delMes && !esPasado ? 'opacity-30' : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs inline-flex items-center justify-center w-5 h-5 rounded-full ${esHoy ? 'bg-[#4a8b2c] text-white font-semibold' : 'text-white/70'}`}>
                                                {dia.getUTCDate()}
                                            </span>
                                            {planDelActivo && <Check size={13} className={estadoCriticoPorEmpleadoId.has(planDelActivo.empleadoId) ? 'text-white shrink-0' : 'text-emerald-300 shrink-0'} />}
                                        </div>
                                        <div className="mt-1 space-y-0.5">
                                            {planDelActivo && (
                                                <div className={`text-[10px] rounded px-1 py-0.5 truncate ${
                                                    estadoCriticoPorEmpleadoId.get(planDelActivo.empleadoId) === 'vencido'
                                                        ? 'bg-red-500/40 text-white font-medium'
                                                        : estadoCriticoPorEmpleadoId.get(planDelActivo.empleadoId) === 'critico'
                                                            ? 'bg-orange-500/40 text-white font-medium'
                                                            : 'bg-emerald-500/25 text-emerald-100'
                                                }`}>
                                                    Tú: {nombrePorEmpleadoId.get(planDelActivo.empleadoId) ?? '—'}
                                                </div>
                                            )}
                                            {estaPendiente && (
                                                <div className="text-[10px] bg-amber-500/25 text-amber-100 rounded px-1 py-0.5 truncate">
                                                    Seleccionado
                                                </div>
                                            )}
                                            {otros.slice(0, 2).map((p) => {
                                                const estadoP = estadoCriticoPorEmpleadoId.get(p.empleadoId);
                                                return (
                                                    <div
                                                        key={p.id}
                                                        className={`text-[10px] rounded px-1 py-0.5 truncate ${
                                                            estadoP === 'vencido'
                                                                ? 'bg-red-500/40 text-white font-medium'
                                                                : estadoP === 'critico'
                                                                    ? 'bg-orange-500/40 text-white font-medium'
                                                                    : 'bg-white/15 text-white/90'
                                                        }`}
                                                    >
                                                        {nombrePorEmpleadoId.get(p.empleadoId) ?? '—'}
                                                    </div>
                                                );
                                            })}
                                            {otros.length > 2 && (
                                                <div className="text-[10px] text-white/50">+{otros.length - 2} más</div>
                                            )}
                                        </div>
                                    </button>
                                );
                            }),
                        )}
                    </div>
                </div>

                {empleadoActivo && (
                    <div className={`${GLASS} rounded-2xl p-5 space-y-3`}>
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-white">
                                Planeando para <span className="font-semibold">{nombrePorEmpleadoId.get(empleadoActivo) ?? '—'}</span>
                            </p>
                            <span className="text-xs font-medium text-white/70 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full shrink-0">
                                {diasSeleccionados.size} {diasSeleccionados.size === 1 ? 'día seleccionado' : 'días seleccionados'}
                            </span>
                        </div>

                        {diasSeleccionados.size > 0 && (
                            <>
                                <input
                                    type="text"
                                    value={notaForm}
                                    onChange={(e) => setNotaForm(e.target.value)}
                                    placeholder="Nota (opcional, aplica a todos los días seleccionados)"
                                    className={`w-full ${GLASS} rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30`}
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={guardarSeleccion}
                                        disabled={guardando}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        {guardando ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                                        Guardar {diasSeleccionados.size} {diasSeleccionados.size === 1 ? 'día' : 'días'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDiasSeleccionados(new Set())}
                                        disabled={guardando}
                                        className={`${GLASS} px-4 py-2 rounded-xl text-sm text-white/70 hover:bg-white/20 cursor-pointer disabled:opacity-50`}
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            </>
                        )}
                        {errorForm && <p className="text-sm text-red-300">{errorForm}</p>}
                    </div>
                )}
            </div>

            <div className={`${GLASS} rounded-2xl overflow-hidden h-fit`}>
                <div className="px-5 py-3 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white">Empleados críticos</h3>
                    <p className="text-xs text-white/50 mt-0.5">Haz clic para planear sus días</p>
                </div>
                {criticos.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-white/50 text-center">Sin empleados críticos.</p>
                ) : (
                    <div className="divide-y divide-white/10">
                        {criticos.map((c) => (
                            <button
                                key={c.empleadoId}
                                type="button"
                                onClick={() => elegirEmpleado(c.empleadoId)}
                                className={`w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer ${
                                    empleadoActivo === c.empleadoId ? 'bg-white/10' : ''
                                }`}
                            >
                                <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-semibold text-[11px] bg-white/15 text-white">
                                    {iniciales(c.nombre)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-white font-medium truncate">{c.nombre}</p>
                                    <p className="text-xs text-white/50 flex items-center gap-1">
                                        {c.estado === 'vencido' ? <AlertTriangle size={11} className="text-red-300" /> : <Clock size={11} className="text-amber-300" />}
                                        {c.estado === 'vencido' ? 'Venció el' : 'Vence el'} {formatearFecha(c.fechaLimiteDisfrute)}
                                    </p>
                                </div>
                                <span className={`text-sm font-bold shrink-0 ${c.estado === 'vencido' ? 'text-red-300' : 'text-amber-300'}`}>
                                    {c.diasPendientes}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
