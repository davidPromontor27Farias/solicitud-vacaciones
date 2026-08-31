import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { obtenerTodosLosDepartamentos, type EmpleadoEquipo, type EstadoSaldo } from '../api/jefe';
import { ApiError } from '../api/client';
import { useJefeAuth } from '../context/JefeAuthContext';
import {
    RefreshCw,
    AlertCircle,
    ShieldCheck,
    Building2,
    ChevronLeft,
} from 'lucide-react';

const GLASS = 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl';

type FiltroSemaforo = 'todos' | EstadoSaldo;

const ORDEN_URGENCIA: EstadoSaldo[] = ['vencido', 'critico', 'vigente'];

const ESTILOS_ESTADO: Record<EstadoSaldo, { texto: string; punto: string; etiqueta: string; borde: string }> = {
    vencido: { texto: 'text-red-300', punto: 'bg-red-400', etiqueta: 'Vencido', borde: 'border-l-red-400' },
    critico: { texto: 'text-amber-300', punto: 'bg-amber-400', etiqueta: 'Por vencer', borde: 'border-l-amber-400' },
    vigente: { texto: 'text-emerald-300', punto: 'bg-emerald-400', etiqueta: 'Vigente', borde: 'border-l-emerald-400' },
};

interface AgregadoEstado {
    dias: number;
    cantidad: number;
    fechaMasCercana: string | null;
}

interface EmpleadoResumen {
    empleadoId: string;
    nombre: string;
    departamento: string;
    puesto: string | null;
    totalPeriodos: number;
    peorEstado: EstadoSaldo;
    porEstado: Record<EstadoSaldo, AgregadoEstado>;
}

interface DepartamentoResumen {
    departamento: string;
    empleados: EmpleadoResumen[];
    porEstado: Record<EstadoSaldo, AgregadoEstado>;
}

interface EmpleadoCercano {
    empleadoId: string;
    nombre: string;
    departamento: string;
    dias: number;
    estado: EstadoSaldo;
    fecha: string;
}

const obtenerPeriodoCercano = (saldos: EmpleadoEquipo['saldos']) => {
    const hoyMs = Date.now();
    return [...saldos].sort((a, b) => {
        const da = Math.abs(new Date(`${a.fechaLimiteDisfrute}T00:00:00.000Z`).getTime() - hoyMs);
        const db = Math.abs(new Date(`${b.fechaLimiteDisfrute}T00:00:00.000Z`).getTime() - hoyMs);
        return da - db;
    })[0];
};

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

function agregadoVacio(): Record<EstadoSaldo, AgregadoEstado> {
    return {
        vencido: { dias: 0, cantidad: 0, fechaMasCercana: null },
        critico: { dias: 0, cantidad: 0, fechaMasCercana: null },
        vigente: { dias: 0, cantidad: 0, fechaMasCercana: null },
    };
}

function agruparPorEmpleado(equipo: EmpleadoEquipo[]): EmpleadoResumen[] {
    return equipo
        .filter((e) => e.saldos.length > 0)
        .map((empleado) => {
            const porEstado = agregadoVacio();
            for (const saldo of empleado.saldos) {
                const agregado = porEstado[saldo.estado];
                agregado.dias += saldo.diasPendientes;
                agregado.cantidad += 1;
                if (!agregado.fechaMasCercana || saldo.fechaLimiteDisfrute < agregado.fechaMasCercana) {
                    agregado.fechaMasCercana = saldo.fechaLimiteDisfrute;
                }
            }
            const peorEstado = ORDEN_URGENCIA.find((estado) => porEstado[estado].cantidad > 0) ?? 'vigente';
            return {
                empleadoId: empleado.empleadoId,
                nombre: empleado.nombre,
                departamento: empleado.departamento ?? 'Sin departamento',
                puesto: empleado.puesto,
                totalPeriodos: empleado.saldos.length,
                peorEstado,
                porEstado,
            };
        });
}

function agruparPorDepartamento(empleados: EmpleadoResumen[]): DepartamentoResumen[] {
    const mapa = new Map<string, EmpleadoResumen[]>();
    for (const empleado of empleados) {
        const lista = mapa.get(empleado.departamento) ?? [];
        lista.push(empleado);
        mapa.set(empleado.departamento, lista);
    }
    return [...mapa.entries()].map(([departamento, empleadosDelDepto]) => {
        const porEstado = agregadoVacio();
        for (const empleado of empleadosDelDepto) {
            for (const estado of ORDEN_URGENCIA) {
                porEstado[estado].dias += empleado.porEstado[estado].dias;
                porEstado[estado].cantidad += empleado.porEstado[estado].cantidad;
            }
        }
        return { departamento, empleados: empleadosDelDepto, porEstado };
    });
}

// Solo interesan los departamentos con gente vencida o por vencer; los que solo
// tienen periodos vigentes no aportan nada a esta vista y se excluyen.
function departamentosConRiesgo(departamentos: DepartamentoResumen[]): DepartamentoResumen[] {
    return departamentos
        .filter((d) => d.porEstado.vencido.cantidad > 0 || d.porEstado.critico.cantidad > 0)
        .sort((a, b) => {
            if (b.porEstado.vencido.dias !== a.porEstado.vencido.dias) return b.porEstado.vencido.dias - a.porEstado.vencido.dias;
            return b.porEstado.critico.dias - a.porEstado.critico.dias;
        });
}

function TablaDepartamentos({ departamentos, filtro, onSeleccionar }: { departamentos: DepartamentoResumen[]; filtro: 'todos' | 'vencido' | 'critico'; onSeleccionar: (departamento: string) => void }) {
    const mostrarVencidos = filtro === 'todos' || filtro === 'vencido';
    const mostrarPorVencer = filtro === 'todos' || filtro === 'critico';

    return (
        <div className={`${GLASS} rounded-2xl overflow-hidden`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-linear-to-r from-[#4a8b2c]/30 to-[#ee7624]/20 border-b border-white/20">
                            <th className="text-left px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Departamento</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Empleados</th>
                            {mostrarVencidos && (
                                <th className="text-center px-4 py-3 font-semibold text-red-200 uppercase tracking-wide text-xs whitespace-nowrap">Días vencidos</th>
                            )}
                            {mostrarPorVencer && (
                                <th className="text-center px-4 py-3 font-semibold text-amber-200 uppercase tracking-wide text-xs whitespace-nowrap">Días por vencer</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {departamentos.map((d, indice) => {
                            const peorEstado: EstadoSaldo = d.porEstado.vencido.cantidad > 0 ? 'vencido' : 'critico';
                            const estilo = ESTILOS_ESTADO[peorEstado];
                            return (
                                <tr
                                    key={d.departamento}
                                    onClick={() => onSeleccionar(d.departamento)}
                                    className={`cursor-pointer transition-colors hover:bg-white/15 border-l-4 ${estilo.borde} ${
                                        indice % 2 === 1 ? 'bg-white/5' : ''
                                    }`}
                                >
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-2.5 min-w-[11rem]">
                                            <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-white/15 text-white">
                                                <Building2 size={14} />
                                            </div>
                                            <p className="text-white font-medium truncate">{d.departamento}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-center text-white/80">{d.empleados.length}</td>
                                    {mostrarVencidos && (
                                        <td className={`px-4 py-3.5 text-center font-bold ${d.porEstado.vencido.cantidad > 0 ? 'text-red-300' : 'text-white/25'}`}>
                                            {d.porEstado.vencido.dias || '—'}
                                        </td>
                                    )}
                                    {mostrarPorVencer && (
                                        <td className={`px-4 py-3.5 text-center font-bold ${d.porEstado.critico.cantidad > 0 ? 'text-amber-300' : 'text-white/25'}`}>
                                            {d.porEstado.critico.dias || '—'}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TablaEmpleadosCercanos({ empleados, onSeleccionar }: { empleados: EmpleadoCercano[]; onSeleccionar: (id: string) => void }) {
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
                                            {e.departamento}
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
            <button type="button" onClick={onVolver} className={`${GLASS} flex items-center gap-1.5 text-sm text-white/80 hover:bg-white/20 px-3 py-1.5 rounded-lg cursor-pointer`}>
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
                <div className="divide-y divide-white/10">
                    {saldosOrdenados.map((saldo) => {
                        const estilo = ESTILOS_ESTADO[saldo.estado];
                        return (
                            <div key={saldo.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                                <div>
                                    <p className="flex items-baseline gap-1.5 whitespace-nowrap text-sm">
                                        <span className={`w-1.5 h-1.5 rounded-full ${estilo.punto}`} />
                                        <span className="text-white/70">{estilo.etiqueta} · Límite:</span>
                                        <span className="text-white/90 font-medium">{formatearFecha(saldo.fechaLimiteDisfrute)}</span>
                                    </p>
                                    <div className="mt-1.5 space-y-1">
                                        <p className="text-sm text-white/70">Días otorgados: <span className="font-semibold text-white">{saldo.diasPorLey}</span></p>
                                        <p className="text-sm text-white/70">Días disfrutados: <span className="font-semibold text-white">{saldo.diasDisfrutados}</span></p>
                                        <p className="text-sm text-white/70">Días pendientes: <span className={`font-semibold ${estilo.texto}`}>{saldo.diasPendientes}</span></p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export function JefeTodosDepartamentosPage() {
    const { jefe } = useJefeAuth();
    const [equipo, setEquipo] = useState<EmpleadoEquipo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<FiltroSemaforo>('todos');
    const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<string | null>(null);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string | null>(null);

    useEffect(() => {
        if (!jefe?.accesoTotal) {
            setCargando(false);
            return;
        }
        obtenerTodosLosDepartamentos()
            .then(setEquipo)
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    }, [jefe?.accesoTotal]);

    const resumenesEmpleados = useMemo(() => agruparPorEmpleado(equipo), [equipo]);
    const departamentos = useMemo(() => agruparPorDepartamento(resumenesEmpleados), [resumenesEmpleados]);
    const departamentosRiesgo = useMemo(() => departamentosConRiesgo(departamentos), [departamentos]);
    const [filtroDepartamentos, setFiltroDepartamentos] = useState<'todos' | 'vencido' | 'critico'>('todos');
    const departamentosFiltrados = useMemo(() => {
        if (filtroDepartamentos === 'todos') return departamentosRiesgo;
        return departamentosRiesgo.filter((d) => d.porEstado[filtroDepartamentos].cantidad > 0);
    }, [departamentosRiesgo, filtroDepartamentos]);

    const conVencido = resumenesEmpleados.filter((r) => r.porEstado.vencido.cantidad > 0).length;
    const conCritico = resumenesEmpleados.filter((r) => r.porEstado.critico.cantidad > 0).length;
    const conVigente = resumenesEmpleados.filter((r) => r.porEstado.vigente.cantidad > 0).length;

    const empleadoDetalle = empleadoSeleccionado ? equipo.find((e) => e.empleadoId === empleadoSeleccionado) ?? null : null;
    const departamentoActivo = departamentoSeleccionado
        ? departamentos.find((d) => d.departamento === departamentoSeleccionado) ?? null
        : null;

    const empleadosCercanosDelDepartamento: EmpleadoCercano[] = useMemo(() => {
        if (!departamentoSeleccionado) return [];
        return equipo
            .filter((e) => (e.departamento ?? 'Sin departamento') === departamentoSeleccionado && e.saldos.length > 0)
            .map((e) => {
                const cercano = obtenerPeriodoCercano(e.saldos);
                return {
                    empleadoId: e.empleadoId,
                    nombre: e.nombre,
                    departamento: e.departamento ?? 'Sin departamento',
                    dias: cercano.diasPendientes,
                    estado: cercano.estado,
                    fecha: cercano.fechaLimiteDisfrute,
                };
            })
            .filter((e) => filtro === 'todos' || e.estado === filtro)
            .sort((a, b) => a.fecha.localeCompare(b.fecha));
    }, [equipo, departamentoSeleccionado, filtro]);

    const SEMAFORO: { id: FiltroSemaforo; label: string; punto: string; cantidad: number }[] = [
        { id: 'todos', label: 'Todos', punto: 'bg-white/60', cantidad: resumenesEmpleados.length },
        { id: 'vencido', label: 'Vencidos', punto: 'bg-red-400', cantidad: conVencido },
        { id: 'critico', label: 'Por vencer', punto: 'bg-amber-400', cantidad: conCritico },
        { id: 'vigente', label: 'Vigentes', punto: 'bg-emerald-400', cantidad: conVigente },
    ];

    const SEMAFORO_DEPARTAMENTOS: { id: 'todos' | 'vencido' | 'critico'; label: string; punto: string; cantidad: number }[] = [
        { id: 'todos', label: 'Todos', punto: 'bg-white/60', cantidad: departamentosRiesgo.length },
        { id: 'vencido', label: 'Vencidos', punto: 'bg-red-400', cantidad: departamentosRiesgo.filter((d) => d.porEstado.vencido.cantidad > 0).length },
        { id: 'critico', label: 'Por vencer', punto: 'bg-amber-400', cantidad: departamentosRiesgo.filter((d) => d.porEstado.critico.cantidad > 0).length },
    ];

    if (!jefe?.accesoTotal) {
        return <Navigate to="/panel-jefe" replace />;
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
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-white">
                <Building2 className="w-5 h-5 text-white/70" />
                <h1 className="text-lg font-semibold">Todos los departamentos</h1>
            </div>

            {empleadoDetalle ? (
                <VistaDetalleEmpleado empleado={empleadoDetalle} onVolver={() => setEmpleadoSeleccionado(null)} />
            ) : departamentoActivo ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setDepartamentoSeleccionado(null)}
                            className={`${GLASS} flex items-center gap-1.5 text-sm text-white/80 hover:bg-white/20 px-3 py-1.5 rounded-lg cursor-pointer`}
                        >
                            <ChevronLeft size={16} />
                            Departamentos
                        </button>
                        <div className="flex items-center gap-2 min-w-0">
                            <Building2 size={16} className="text-white/50 shrink-0" />
                            <h2 className="text-base font-bold text-white truncate">{departamentoActivo.departamento}</h2>
                            <span className="text-xs font-medium text-white/70 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full shrink-0">
                                {empleadosCercanosDelDepartamento.length}
                            </span>
                        </div>
                    </div>

                    <div className={`flex flex-wrap gap-2 ${GLASS} p-1.5 rounded-2xl w-fit`}>
                        {SEMAFORO.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setFiltro(s.id)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                                    filtro === s.id ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow' : 'text-white/70 hover:bg-white/10'
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

                    {empleadosCercanosDelDepartamento.length === 0 ? (
                        <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                            <ShieldCheck className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                            <p className="text-white/60 text-sm">Sin registros con este filtro.</p>
                        </div>
                    ) : (
                        <TablaEmpleadosCercanos empleados={empleadosCercanosDelDepartamento} onSeleccionar={setEmpleadoSeleccionado} />
                    )}
                </div>
            ) : departamentosRiesgo.length === 0 ? (
                <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                    <ShieldCheck className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                    <p className="text-white font-medium">Todo en orden</p>
                    <p className="text-white/60 text-sm mt-1">Ningún departamento tiene días vencidos o próximos a vencer.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className={`flex flex-wrap gap-2 ${GLASS} p-1.5 rounded-2xl w-fit`}>
                        {SEMAFORO_DEPARTAMENTOS.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setFiltroDepartamentos(s.id)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                                    filtroDepartamentos === s.id ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow' : 'text-white/70 hover:bg-white/10'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${s.punto}`} />
                                {s.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filtroDepartamentos === s.id ? 'bg-white/20' : 'bg-white/10 text-white/60'}`}>
                                    {s.cantidad}
                                </span>
                            </button>
                        ))}
                    </div>

                    {departamentosFiltrados.length === 0 ? (
                        <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                            <ShieldCheck className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                            <p className="text-white/60 text-sm">Sin registros con este filtro.</p>
                        </div>
                    ) : (
                        <TablaDepartamentos departamentos={departamentosFiltrados} filtro={filtroDepartamentos} onSeleccionar={setDepartamentoSeleccionado} />
                    )}
                </div>
            )}
        </div>
    );
}
