import { useEffect, useMemo, useState } from 'react';
import { obtenerEquipo, type EmpleadoEquipo, type EstadoSaldo } from '../api/jefe';
import { ApiError } from '../api/client';
import {
    RefreshCw,
    AlertCircle,
    ShieldCheck,
    Building2,
    LayoutGrid,
    List,
    CalendarDays,
    ChevronLeft,
} from 'lucide-react';

const GLASS = 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl';

type FiltroSemaforo = 'todos' | EstadoSaldo;
type ModoVista = 'tarjetas' | 'listado';

// Orden de urgencia: si un empleado tiene al menos un periodo vencido, ese es su
// "peor estado" aunque tenga otros periodos vigentes; critico solo gana si no hay vencidos.
const ORDEN_URGENCIA: EstadoSaldo[] = ['vencido', 'critico', 'vigente'];

interface AgregadoEstado {
    dias: number;
    cantidad: number;
    fechaMasCercana: string | null;
}

interface EmpleadoResumen {
    empleadoId: string;
    nombre: string;
    departamento: string | null;
    puesto: string | null;
    totalPeriodos: number;
    peorEstado: EstadoSaldo;
    porEstado: Record<EstadoSaldo, AgregadoEstado>;
}

const ESTILOS_ESTADO: Record<EstadoSaldo, { texto: string; punto: string; etiqueta: string; borde: string }> = {
    vencido: { texto: 'text-red-300', punto: 'bg-red-400', etiqueta: 'Vencido', borde: 'border-l-red-400' },
    critico: { texto: 'text-amber-300', punto: 'bg-amber-400', etiqueta: 'Por vencer', borde: 'border-l-amber-400' },
    vigente: { texto: 'text-emerald-300', punto: 'bg-emerald-400', etiqueta: 'Vigente', borde: 'border-l-emerald-400' },
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

function agruparPorEmpleado(equipo: EmpleadoEquipo[]): EmpleadoResumen[] {
    return equipo
        .filter((empleado) => empleado.saldos.length > 0)
        .map((empleado) => {
            const porEstado: Record<EstadoSaldo, AgregadoEstado> = {
                vencido: { dias: 0, cantidad: 0, fechaMasCercana: null },
                critico: { dias: 0, cantidad: 0, fechaMasCercana: null },
                vigente: { dias: 0, cantidad: 0, fechaMasCercana: null },
            };
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
                departamento: empleado.departamento,
                puesto: empleado.puesto,
                totalPeriodos: empleado.saldos.length,
                peorEstado,
                porEstado,
            };
        });
}

function TarjetaEmpleado({ resumen, estadoMostrado, onClick }: { resumen: EmpleadoResumen; estadoMostrado: EstadoSaldo; onClick: () => void }) {
    const estilo = ESTILOS_ESTADO[estadoMostrado];
    const agregado = resumen.porEstado[estadoMostrado];
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${GLASS} hover:bg-white/15 transition-colors duration-200 text-left w-full rounded-2xl border-l-4 ${estilo.borde} p-5 cursor-pointer`}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-semibold text-sm bg-white/15 text-white">
                    {iniciales(resumen.nombre)}
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-white leading-snug truncate">{resumen.nombre}</p>
                    <p className="text-xs text-white/60 truncate">{resumen.puesto || 'Sin puesto'}</p>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-white/60 mb-4 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 size={13} className="text-white/40 shrink-0" />
                    <span className="truncate">{resumen.departamento || 'Sin departamento'}</span>
                </div>
                <span className="shrink-0 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
                    {resumen.totalPeriodos} {resumen.totalPeriodos === 1 ? 'periodo' : 'periodos'}
                </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div>
                    <p className="text-[11px] text-white/50 uppercase tracking-wide flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${estilo.punto}`} />
                        {estilo.etiqueta}
                    </p>
                    <p className={`text-2xl font-bold ${estilo.texto}`}>{agregado.dias}</p>
                </div>
                <div className="text-right">
                    <p className="text-[11px] text-white/40 uppercase tracking-wide">Límite</p>
                    <p className="text-sm font-medium text-white/80">{agregado.fechaMasCercana ? formatearFecha(agregado.fechaMasCercana) : '—'}</p>
                </div>
            </div>
        </button>
    );
}

function FilaEmpleado({ resumen, estadoMostrado, onClick }: { resumen: EmpleadoResumen; estadoMostrado: EstadoSaldo; onClick: () => void }) {
    const estilo = ESTILOS_ESTADO[estadoMostrado];
    const agregado = resumen.porEstado[estadoMostrado];
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-white/10 transition-colors cursor-pointer"
        >
            <div className="min-w-0">
                <p className="text-white font-medium truncate">{resumen.nombre}</p>
                <p className="text-xs text-white/50 truncate mt-0.5">
                    {resumen.departamento || 'Sin departamento'}
                    {resumen.puesto ? ` · ${resumen.puesto}` : ''}
                    {' · '}{resumen.totalPeriodos} {resumen.totalPeriodos === 1 ? 'periodo' : 'periodos'}
                </p>
            </div>
            <div className="text-right shrink-0">
                <p className="flex items-baseline justify-end gap-1.5 whitespace-nowrap">
                    <span className={`w-1.5 h-1.5 rounded-full ${estilo.punto}`} />
                    <span className="text-xs text-white/50">{estilo.etiqueta}:</span>
                    <span className={`text-lg font-bold ${estilo.texto}`}>{agregado.dias}</span>
                </p>
                <p className="flex items-baseline justify-end gap-1.5 whitespace-nowrap mt-0.5">
                    <span className="text-[11px] text-white/50">Límite:</span>
                    <span className="text-[11px] text-white/70 font-medium">{agregado.fechaMasCercana ? formatearFecha(agregado.fechaMasCercana) : '—'}</span>
                </p>
            </div>
        </button>
    );
}

function SeccionListado({ titulo, estado, items, onSeleccionar }: { titulo: string; estado: EstadoSaldo; items: EmpleadoResumen[]; onSeleccionar: (empleadoId: string) => void }) {
    const estilo = ESTILOS_ESTADO[estado];
    return (
        <div className={`${GLASS} rounded-2xl overflow-hidden`}>
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${estilo.punto}`} />
                <h3 className="text-sm font-semibold text-white">{titulo}</h3>
                <span className="text-xs font-medium text-white/70 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
                    {items.length}
                </span>
            </div>
            {items.length === 0 ? (
                <p className="px-5 py-6 text-sm text-white/50 text-center">Sin registros.</p>
            ) : (
                <div className="divide-y divide-white/10">
                    {items.map((resumen) => (
                        <FilaEmpleado key={resumen.empleadoId} resumen={resumen} estadoMostrado={estado} onClick={() => onSeleccionar(resumen.empleadoId)} />
                    ))}
                </div>
            )}
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
                <div className="divide-y divide-white/10">
                    {saldosOrdenados.length === 0 && (
                        <p className="px-5 py-6 text-sm text-white/50 text-center">Este empleado no tiene periodos registrados.</p>
                    )}
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

export function JefeEquipoPage() {
    const [equipo, setEquipo] = useState<EmpleadoEquipo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<FiltroSemaforo>('todos');
    const [modoVista, setModoVista] = useState<ModoVista>('tarjetas');
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string | null>(null);

    useEffect(() => {
        obtenerEquipo()
            .then(setEquipo)
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    }, []);

    const resumenes = useMemo(() => agruparPorEmpleado(equipo), [equipo]);
    const conVencido = resumenes.filter((r) => r.porEstado.vencido.cantidad > 0);
    const conCritico = resumenes.filter((r) => r.porEstado.critico.cantidad > 0);
    const conVigente = resumenes.filter((r) => r.porEstado.vigente.cantidad > 0);

    const resumenesFiltrados = filtro === 'todos' ? resumenes : resumenes.filter((r) => r.porEstado[filtro].cantidad > 0);
    const empleadoDetalle = empleadoSeleccionado ? equipo.find((e) => e.empleadoId === empleadoSeleccionado) ?? null : null;

    // Vista "Todos" agrupada por peor estado: cada empleado aparece en una sola sección
    // (la de su estado mas urgente), en vez de repetirse si tiene varios periodos.
    const porPeorEstadoVencido = resumenes.filter((r) => r.peorEstado === 'vencido');
    const porPeorEstadoCritico = resumenes.filter((r) => r.peorEstado === 'critico');
    const porPeorEstadoVigente = resumenes.filter((r) => r.peorEstado === 'vigente');

    const SEMAFORO: { id: FiltroSemaforo; label: string; punto: string; cantidad: number }[] = [
        { id: 'todos', label: 'Todos', punto: 'bg-white/60', cantidad: resumenes.length },
        { id: 'vencido', label: 'Vencidos', punto: 'bg-red-400', cantidad: conVencido.length },
        { id: 'critico', label: 'Por vencer', punto: 'bg-amber-400', cantidad: conCritico.length },
        { id: 'vigente', label: 'Vigentes', punto: 'bg-emerald-400', cantidad: conVigente.length },
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
                    <div className="flex flex-wrap items-center justify-between gap-3">
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

                        <div className={`flex gap-2 ${GLASS} p-1.5 rounded-2xl w-fit`}>
                            <button
                                type="button"
                                onClick={() => setModoVista('tarjetas')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                                    modoVista === 'tarjetas' ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow' : 'text-white/70 hover:bg-white/10'
                                }`}
                            >
                                <LayoutGrid size={14} />
                                Tarjetas
                            </button>
                            <button
                                type="button"
                                onClick={() => setModoVista('listado')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                                    modoVista === 'listado' ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow' : 'text-white/70 hover:bg-white/10'
                                }`}
                            >
                                <List size={14} />
                                Listado
                            </button>
                        </div>
                    </div>

                    {resumenesFiltrados.length === 0 ? (
                        <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                            <ShieldCheck className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                            <p className="text-white/60 text-sm">Sin registros con este filtro.</p>
                        </div>
                    ) : modoVista === 'tarjetas' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {resumenesFiltrados.map((resumen) => (
                                <TarjetaEmpleado
                                    key={resumen.empleadoId}
                                    resumen={resumen}
                                    estadoMostrado={filtro === 'todos' ? resumen.peorEstado : filtro}
                                    onClick={() => setEmpleadoSeleccionado(resumen.empleadoId)}
                                />
                            ))}
                        </div>
                    ) : filtro === 'todos' ? (
                        <div className="space-y-4">
                            <SeccionListado titulo="Vencidos" estado="vencido" items={porPeorEstadoVencido} onSeleccionar={setEmpleadoSeleccionado} />
                            <SeccionListado titulo="Próximos a vencer" estado="critico" items={porPeorEstadoCritico} onSeleccionar={setEmpleadoSeleccionado} />
                            <SeccionListado titulo="Vigentes" estado="vigente" items={porPeorEstadoVigente} onSeleccionar={setEmpleadoSeleccionado} />
                        </div>
                    ) : (
                        <SeccionListado
                            titulo={ESTILOS_ESTADO[filtro].etiqueta}
                            estado={filtro}
                            items={resumenesFiltrados}
                            onSeleccionar={setEmpleadoSeleccionado}
                        />
                    )}
                    </>
                    )}
                </div>
            )}
        </div>
    );
}
