import { useEffect, useMemo, useState } from 'react';
import { obtenerVacacionesCriticas, obtenerDetalleEmpleado, type VacacionCritica, type DetalleEmpleadoAdmin } from '../api/admin';
import { ApiError } from '../api/client';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
    AlertTriangle,
    Clock,
    CalendarDays,
    Building2,
    UserCheck,
    Search,
    RefreshCw,
    AlertCircle,
    ShieldCheck,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    Users,
    Mail,
} from 'lucide-react';

const TARJETAS_POR_PAGINA = 6;

type Filtro = 'vencido' | 'critico';

const GLASS = 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl';

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

interface DepartamentoResumen {
    departamento: string;
    items: VacacionCritica[];
    totalDias: number;
    empleados: number;
}

function agruparPorDepartamento(items: VacacionCritica[]): DepartamentoResumen[] {
    const mapa = new Map<string, VacacionCritica[]>();
    for (const item of items) {
        const lista = mapa.get(item.departamento) ?? [];
        lista.push(item);
        mapa.set(item.departamento, lista);
    }
    return [...mapa.entries()]
        .map(([departamento, items]) => ({
            departamento,
            items,
            totalDias: items.reduce((acc, i) => acc + i.diasPendientes, 0),
            empleados: new Set(items.map((i) => i.empleadoId)).size,
        }))
        .sort((a, b) => b.totalDias - a.totalDias);
}

interface TarjetaResumenProps {
    icono: React.ReactNode;
    etiqueta: string;
    valor: number;
    texto: string;
}

function TarjetaResumen({ icono, etiqueta, valor, texto }: TarjetaResumenProps) {
    return (
        <div className={`${GLASS} p-5 rounded-2xl`}>
            <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">{etiqueta}</span>
                {icono}
            </div>
            <p className={`text-3xl font-bold mt-2 ${texto}`}>{valor}</p>
        </div>
    );
}

function TarjetaVacacionCritica({ item, onClick }: { item: VacacionCritica; onClick: () => void }) {
    const esVencido = item.estado === 'vencido';
    const acento = esVencido ? 'border-l-red-400' : 'border-l-amber-400';
    const avatar = esVencido ? 'bg-red-500/20 text-red-200' : 'bg-amber-500/20 text-amber-200';
    const numero = esVencido ? 'text-red-300' : 'text-amber-300';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`${GLASS} hover:bg-white/15 transition-colors duration-200 text-left w-full rounded-2xl border-l-4 ${acento} p-5 cursor-pointer`}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-semibold text-sm ${avatar}`}>
                    {iniciales(item.nombre)}
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-white leading-snug">{item.nombre}</p>
                    <p className="text-xs text-white/60 truncate">{item.puesto || 'Sin puesto'} · #{item.numeroEmpleado}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/60 mb-4">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 size={13} className="text-white/40 shrink-0" />
                    <span className="truncate">{item.departamento}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                    <UserCheck size={13} className="text-white/40 shrink-0" />
                    <span className="truncate">{item.jefeDirecto?.nombre ?? 'Sin jefe directo'}</span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div>
                    <p className="text-[11px] text-white/40 uppercase tracking-wide">{esVencido ? 'Días vencidos' : 'Días próximos a vencer'}</p>
                    <p className={`text-2xl font-bold ${numero}`}>{item.diasPendientes}</p>
                </div>
                <div className="text-right">
                    <p className="text-[11px] text-white/40 uppercase tracking-wide">{esVencido ? 'Venció' : 'Vence'}</p>
                    <p className="text-sm font-medium text-white/80">{formatearFecha(item.fechaVencimiento)}</p>
                </div>
            </div>
        </button>
    );
}

function TarjetaDepartamento({ resumen, esVencido, onClick }: { resumen: DepartamentoResumen; esVencido: boolean; onClick: () => void }) {
    const acento = esVencido ? 'border-l-red-400' : 'border-l-amber-400';
    const icono = esVencido ? 'bg-red-500/20 text-red-200' : 'bg-amber-500/20 text-amber-200';
    const numero = esVencido ? 'text-red-300' : 'text-amber-300';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`${GLASS} hover:bg-white/15 transition-colors duration-200 text-left rounded-2xl border-l-4 ${acento} p-5 cursor-pointer`}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center ${icono}`}>
                    <Building2 size={20} />
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-white leading-snug">{resumen.departamento}</p>
                    <p className="text-xs text-white/60 flex items-center gap-1">
                        <Users size={12} />
                        {resumen.empleados} {resumen.empleados === 1 ? 'empleado' : 'empleados'}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div>
                    <p className="text-[11px] text-white/40 uppercase tracking-wide">{esVencido ? 'Días vencidos' : 'Días próximos a vencer'}</p>
                    <p className={`text-2xl font-bold ${numero}`}>{resumen.totalDias}</p>
                </div>
                <ChevronRight className="text-white/40" size={20} />
            </div>
        </button>
    );
}

function PaginacionControles({ paginaActual, totalPaginas, onPaginaChange }: { paginaActual: number; totalPaginas: number; onPaginaChange: (pagina: number) => void }) {
    if (totalPaginas <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-1.5 pt-1">
            <button
                type="button"
                onClick={() => onPaginaChange(paginaActual - 1)}
                disabled={paginaActual === 1}
                className={`${GLASS} p-1.5 rounded-lg text-white/70 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 cursor-pointer disabled:cursor-not-allowed`}
            >
                <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numero) => (
                <button
                    key={numero}
                    type="button"
                    onClick={() => onPaginaChange(numero)}
                    className={`min-w-[2rem] px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        numero === paginaActual
                            ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow'
                            : `${GLASS} text-white/70 hover:bg-white/20`
                    }`}
                >
                    {numero}
                </button>
            ))}
            <button
                type="button"
                onClick={() => onPaginaChange(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className={`${GLASS} p-1.5 rounded-lg text-white/70 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 cursor-pointer disabled:cursor-not-allowed`}
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

function VistaDepartamentos({ departamentos, esVencido, pagina, onPaginaChange, onSeleccionar }: {
    departamentos: DepartamentoResumen[];
    esVencido: boolean;
    pagina: number;
    onPaginaChange: (pagina: number) => void;
    onSeleccionar: (departamento: string) => void;
}) {
    const totalPaginas = Math.max(1, Math.ceil(departamentos.length / TARJETAS_POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const inicio = (paginaActual - 1) * TARJETAS_POR_PAGINA;
    const visibles = departamentos.slice(inicio, inicio + TARJETAS_POR_PAGINA);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibles.map((resumen) => (
                    <TarjetaDepartamento
                        key={resumen.departamento}
                        resumen={resumen}
                        esVencido={esVencido}
                        onClick={() => onSeleccionar(resumen.departamento)}
                    />
                ))}
            </div>
            <PaginacionControles paginaActual={paginaActual} totalPaginas={totalPaginas} onPaginaChange={onPaginaChange} />
        </div>
    );
}

function VistaEmpleados({ departamento, items, pagina, onPaginaChange, onVolver, onSeleccionarEmpleado }: {
    departamento: string;
    items: VacacionCritica[];
    pagina: number;
    onPaginaChange: (pagina: number) => void;
    onVolver: () => void;
    onSeleccionarEmpleado: (empleadoId: string) => void;
}) {
    const totalPaginas = Math.max(1, Math.ceil(items.length / TARJETAS_POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const inicio = (paginaActual - 1) * TARJETAS_POR_PAGINA;
    const visibles = items.slice(inicio, inicio + TARJETAS_POR_PAGINA);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onVolver}
                    className={`${GLASS} flex items-center gap-1.5 text-sm text-white/80 hover:bg-white/20 px-3 py-1.5 rounded-lg cursor-pointer`}
                >
                    <ChevronLeft size={16} />
                    Departamentos
                </button>
                <div className="flex items-center gap-2 min-w-0">
                    <Building2 size={16} className="text-white/50 shrink-0" />
                    <h2 className="text-base font-bold text-white truncate">{departamento}</h2>
                    <span className="text-xs font-medium text-white/70 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full shrink-0">{items.length}</span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibles.map((item) => (
                    <TarjetaVacacionCritica key={item.saldoId} item={item} onClick={() => onSeleccionarEmpleado(item.empleadoId)} />
                ))}
            </div>
            <PaginacionControles paginaActual={paginaActual} totalPaginas={totalPaginas} onPaginaChange={onPaginaChange} />
        </div>
    );
}

const ESTADO_SALDO_ESTILOS: Record<'vencido' | 'critico' | 'vigente', { texto: string }> = {
    vencido: { texto: 'text-red-300' },
    critico: { texto: 'text-amber-300' },
    vigente: { texto: 'text-emerald-300' },
};

function VistaDetalleEmpleado({ detalle, cargando, error, filtro, onVolver }: {
    detalle: DetalleEmpleadoAdmin | null;
    cargando: boolean;
    error: string | null;
    filtro: Filtro;
    onVolver: () => void;
}) {
    const esVencidoActivo = filtro === 'vencido';
    const etiquetaDias = esVencidoActivo ? 'vencidos' : 'por vencer';
    const saldosFiltrados = detalle?.saldos.filter((s) => s.estado === filtro) ?? [];

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

            {!cargando && !error && detalle && (
                <>
                    <div className={`${GLASS} rounded-2xl p-6`}>
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center font-semibold bg-white/15 text-white text-lg">
                                {iniciales(detalle.nombre)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-bold text-white leading-snug">{detalle.nombre}</p>
                                <p className="text-sm text-white/60">{detalle.puesto || 'Sin puesto'} · #{detalle.numeroEmpleado}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-sm">
                            <div className="flex items-center gap-2">
                                <Building2 size={14} className="text-white/40 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[11px] text-white/40 uppercase tracking-wide">Departamento</p>
                                    <p className="text-white/90 truncate">{detalle.departamento || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={14} className="text-white/40 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[11px] text-white/40 uppercase tracking-wide">Sociedad</p>
                                    <p className="text-white/90 truncate">{detalle.sociedad || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <UserCheck size={14} className="text-white/40 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[11px] text-white/40 uppercase tracking-wide">Jefe directo</p>
                                    <p className="text-white/90 truncate">{detalle.jefeDirecto?.nombre || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-white/40 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[11px] text-white/40 uppercase tracking-wide">Correo personal</p>
                                    <p className="text-white/90 truncate">{detalle.correoPersonal || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`${GLASS} rounded-2xl overflow-hidden`}>
                        <div className="px-5 py-3 border-b border-white/10">
                            <h3 className="text-sm font-semibold text-white">{esVencidoActivo ? 'Periodos vencidos' : 'Periodos por vencer'}</h3>
                        </div>
                        <div className="divide-y divide-white/10">
                            {saldosFiltrados.length === 0 && (
                                <p className="px-5 py-6 text-sm text-white/50 text-center">
                                    Este empleado no tiene periodos {esVencidoActivo ? 'vencidos' : 'por vencer'}.
                                </p>
                            )}
                            {saldosFiltrados.map((saldo) => {
                                const estilos = ESTADO_SALDO_ESTILOS[saldo.estado];
                                return (
                                    <div key={saldo.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                                        <div>
                                            <p className="text-white/90">{formatearFecha(saldo.inicioValidez)} — {formatearFecha(saldo.fechaVencimiento)}</p>
                                            <p className="text-white/50 text-xs mt-0.5">
                                                {saldo.diasPorLey} por ley · {saldo.diasDisfrutados} disfrutados · <span className={estilos.texto}>{saldo.diasPendientes} {etiquetaDias}</span>
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export function AdminDashboardPage() {
    const { admin } = useAdminAuth();
    const [items, setItems] = useState<VacacionCritica[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState<Filtro>('vencido');
    const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<string | null>(null);
    const [paginaDepartamentos, setPaginaDepartamentos] = useState(1);
    const [paginaEmpleados, setPaginaEmpleados] = useState(1);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string | null>(null);
    const [detalleEmpleado, setDetalleEmpleado] = useState<DetalleEmpleadoAdmin | null>(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

    useEffect(() => {
        setDepartamentoSeleccionado(null);
        setPaginaDepartamentos(1);
        setPaginaEmpleados(1);
        setEmpleadoSeleccionado(null);
    }, [busqueda, filtro]);

    useEffect(() => {
        setPaginaEmpleados(1);
        setEmpleadoSeleccionado(null);
    }, [departamentoSeleccionado]);

    useEffect(() => {
        if (!empleadoSeleccionado) {
            setDetalleEmpleado(null);
            return;
        }
        setCargandoDetalle(true);
        setErrorDetalle(null);
        obtenerDetalleEmpleado(empleadoSeleccionado)
            .then(setDetalleEmpleado)
            .catch((err) => setErrorDetalle(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargandoDetalle(false));
    }, [empleadoSeleccionado]);

    useEffect(() => {
        obtenerVacacionesCriticas()
            .then(setItems)
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    }, []);

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        if (!termino) return items;
        return items.filter(
            (i) => i.nombre.toLowerCase().includes(termino) || i.departamento.toLowerCase().includes(termino),
        );
    }, [items, busqueda]);

    const vencidos = filtrados.filter((i) => i.estado === 'vencido');
    const criticos = filtrados.filter((i) => i.estado === 'critico');
    const totalDiasVencidos = vencidos.reduce((acc, i) => acc + i.diasPendientes, 0);
    const totalDiasCriticos = criticos.reduce((acc, i) => acc + i.diasPendientes, 0);
    const empleadosAfectados = new Set(filtrados.map((i) => i.empleadoId)).size;

    const itemsActivos = filtro === 'vencido' ? vencidos : criticos;
    const esVencidoActivo = filtro === 'vencido';
    const departamentosActivos = useMemo(() => agruparPorDepartamento(itemsActivos), [itemsActivos]);
    const grupoSeleccionado = departamentoSeleccionado
        ? departamentosActivos.find((d) => d.departamento === departamentoSeleccionado)
        : undefined;

    const FILTROS: { id: Filtro; label: string; icono: React.ReactNode; cantidad: number }[] = [
        { id: 'vencido', label: 'Vencidos', icono: <AlertTriangle size={14} />, cantidad: vencidos.length },
        { id: 'critico', label: 'Por vencer', icono: <Clock size={14} />, cantidad: criticos.length },
    ];

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <section className="bg-linear-to-r from-[#4a8b2c] to-[#ee7624] p-8 rounded-2xl shadow-lg text-white">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-4 rounded-full">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Vacaciones críticas y vencidas</h1>
                        <p className="text-white/80 text-sm">
                            {admin ? `Bienvenido, ${admin.nombre}` : 'Panel administrativo'}
                        </p>
                    </div>
                </div>
            </section>

            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <TarjetaResumen
                    icono={<AlertTriangle className="w-5 h-5 text-red-300" />}
                    etiqueta={`Días vencidos · ${vencidos.length} ${vencidos.length === 1 ? 'registro' : 'registros'}`}
                    valor={totalDiasVencidos}
                    texto="text-red-300"
                />
                <TarjetaResumen
                    icono={<Clock className="w-5 h-5 text-amber-300" />}
                    etiqueta={`Días por vencer · ${criticos.length} ${criticos.length === 1 ? 'registro' : 'registros'}`}
                    valor={totalDiasCriticos}
                    texto="text-amber-300"
                />
                <TarjetaResumen
                    icono={<CalendarDays className="w-5 h-5 text-indigo-300" />}
                    etiqueta="Empleados afectados"
                    valor={empleadosAfectados}
                    texto="text-indigo-300"
                />
            </div>

            {/* Buscador */}
            {items.length > 0 && (
                <div className="relative">
                    <Search className="w-4 h-4 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre o departamento..."
                        className={`w-full ${GLASS} rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30`}
                    />
                </div>
            )}

            {/* Estados */}
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

            {!cargando && !error && items.length === 0 && (
                <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                    <ShieldCheck className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                    <p className="text-white font-medium">Todo en orden</p>
                    <p className="text-white/60 text-sm mt-1">No hay saldos vencidos ni próximos a vencer en los próximos 30 días.</p>
                </div>
            )}

            {!cargando && !error && items.length > 0 && filtrados.length === 0 && (
                <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                    <Search className="w-10 h-10 text-white/40 mx-auto mb-3" />
                    <p className="text-white/60 text-sm">Sin resultados para “{busqueda}”.</p>
                </div>
            )}

            {!cargando && !error && filtrados.length > 0 && (
                <div className="space-y-6">
                    <div className={`flex gap-2 ${GLASS} p-1.5 rounded-2xl w-fit`}>
                        {FILTROS.map((f) => (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setFiltro(f.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                                    filtro === f.id
                                        ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow'
                                        : 'text-white/70 hover:bg-white/10'
                                }`}
                            >
                                {f.icono}
                                {f.label}
                                <span
                                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                                        filtro === f.id ? 'bg-white/20' : 'bg-white/10 text-white/60'
                                    }`}
                                >
                                    {f.cantidad}
                                </span>
                            </button>
                        ))}
                    </div>

                    {itemsActivos.length === 0 ? (
                        <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                            <ShieldCheck className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                            <p className="text-white/60 text-sm">
                                {esVencidoActivo ? 'No hay saldos vencidos.' : 'No hay saldos por vencer en los próximos 30 días.'}
                            </p>
                        </div>
                    ) : empleadoSeleccionado ? (
                        <VistaDetalleEmpleado
                            detalle={detalleEmpleado}
                            cargando={cargandoDetalle}
                            error={errorDetalle}
                            filtro={filtro}
                            onVolver={() => setEmpleadoSeleccionado(null)}
                        />
                    ) : departamentoSeleccionado ? (
                        <VistaEmpleados
                            departamento={departamentoSeleccionado}
                            items={grupoSeleccionado?.items ?? []}
                            pagina={paginaEmpleados}
                            onPaginaChange={setPaginaEmpleados}
                            onVolver={() => setDepartamentoSeleccionado(null)}
                            onSeleccionarEmpleado={setEmpleadoSeleccionado}
                        />
                    ) : (
                        <VistaDepartamentos
                            departamentos={departamentosActivos}
                            esVencido={esVencidoActivo}
                            pagina={paginaDepartamentos}
                            onPaginaChange={setPaginaDepartamentos}
                            onSeleccionar={setDepartamentoSeleccionado}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
