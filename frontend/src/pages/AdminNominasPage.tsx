import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileSpreadsheet, Upload, Download, RefreshCw, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Mail, FileClock } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
    subirCorreosJefes,
    subirReporteVacaciones,
    obtenerSolicitudesPorEstatus,
    descargarReporteSolicitudes,
    descargarReporteVacacionesPeriodo,
    obtenerHistorialCargas,
    type ActualizarCorreosJefesResultado,
    type ImportarReporteVacacionesResultado,
    type HistorialCargaItem,
    type EstatusSolicitud,
    type SolicitudPorEstatus,
} from '../api/admin';
import { ApiError } from '../api/client';

const GLASS = 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl';
const POR_PAGINA = 10;

type Seccion = 'correos' | 'vacaciones' | 'historial' | 'solicitudes' | 'reportes';

// Mismas rutas que usan los enlaces de navegación en AdminLayout.
const RUTA_POR_SECCION: Record<string, Seccion> = {
    '/admin': 'correos',
    '/admin/reporte-vacaciones': 'vacaciones',
    '/admin/historial-cargas': 'historial',
    '/admin/nomina-solicitudes': 'solicitudes',
    '/admin/nomina-reportes': 'reportes',
};

const ESTATUS_TABS: { id: EstatusSolicitud; label: string }[] = [
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'aprobada', label: 'Aprobadas' },
    { id: 'rechazada', label: 'Rechazadas' },
];

function formatearFecha(iso: string | null): string {
    if (!iso) return '—';
    return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    });
}

function SeccionCorreosJefes() {
    const [archivo, setArchivo] = useState<File | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [resultado, setResultado] = useState<ActualizarCorreosJefesResultado | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function subir() {
        if (!archivo) return;
        setSubiendo(true);
        setError(null);
        setResultado(null);
        try {
            const res = await subirCorreosJefes(archivo);
            setResultado(res);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado al subir el archivo');
        } finally {
            setSubiendo(false);
        }
    }

    return (
        <div className={`${GLASS} rounded-2xl p-6 space-y-4`}>
            <div>
                <h3 className="text-white font-semibold">Actualizar correos de jefes directos</h3>
                <p className="text-white/60 text-sm mt-1">
                    Sube un archivo .xlsx con las columnas "Número de empleado", "Nombre" y "correo".
                    Se actualizará el correo del jefe que coincida con ese número de empleado.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                    className="text-sm text-white/80 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/20 file:text-white file:cursor-pointer file:hover:bg-white/30 cursor-pointer"
                />
                <button
                    type="button"
                    onClick={subir}
                    disabled={!archivo || subiendo}
                    className="flex items-center gap-2 bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    {subiendo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {subiendo ? 'Subiendo...' : 'Subir archivo'}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-200 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {resultado && (
                <div className="space-y-2 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        {resultado.actualizados} {resultado.actualizados === 1 ? 'jefe actualizado' : 'jefes actualizados'}
                    </div>
                    {resultado.noEncontrados.length > 0 && (
                        <div className="text-sm text-amber-300">
                            <p className="font-medium mb-1">{resultado.noEncontrados.length} no encontrados en la base de datos:</p>
                            <ul className="text-white/60 text-xs space-y-0.5 max-h-32 overflow-y-auto">
                                {resultado.noEncontrados.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function SeccionReporteVacaciones() {
    const [archivo, setArchivo] = useState<File | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [resultado, setResultado] = useState<ImportarReporteVacacionesResultado | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function subir() {
        if (!archivo) return;
        setSubiendo(true);
        setError(null);
        setResultado(null);
        try {
            const res = await subirReporteVacaciones(archivo);
            setResultado(res);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado al subir el archivo');
        } finally {
            setSubiendo(false);
        }
    }

    return (
        <div className={`${GLASS} rounded-2xl p-6 space-y-4`}>
            <div>
                <h3 className="text-white font-semibold">Actualizar reporte de vacaciones (SAP)</h3>
                <p className="text-white/60 text-sm mt-1">
                    Sube cada mes el mismo reporte que se descarga de SAP (una fila por empleado y periodo).
                    Se descuentan los días ya tomados, se agregan los periodos nuevos que se hayan liberado,
                    y se actualizan jefe directo, jefe matricial y backup. Si la app ya tiene registrados más
                    días tomados de los que trae este archivo (por una solicitud aprobada reciente que SAP
                    todavía no refleja), esos días no se pierden. Los periodos de un empleado que ya no
                    aparezcan en el archivo (porque SAP los corrigió o eliminó) se eliminan también aquí.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                    className="text-sm text-white/80 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/20 file:text-white file:cursor-pointer file:hover:bg-white/30 cursor-pointer"
                />
                <button
                    type="button"
                    onClick={subir}
                    disabled={!archivo || subiendo}
                    className="flex items-center gap-2 bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    {subiendo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {subiendo ? 'Procesando...' : 'Subir reporte'}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-200 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {resultado && (
                <div className="space-y-3 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        {resultado.filasLeidas} filas leídas
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                        <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/50 text-xs">Empleados nuevos</p>
                            <p className="text-white font-semibold">{resultado.empleadosCreados}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/50 text-xs">Empleados actualizados</p>
                            <p className="text-white font-semibold">{resultado.empleadosActualizados}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/50 text-xs">Periodos nuevos</p>
                            <p className="text-white font-semibold">{resultado.periodosCreados}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/50 text-xs">Periodos actualizados</p>
                            <p className="text-white font-semibold">{resultado.periodosActualizados}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/50 text-xs">Periodos eliminados</p>
                            <p className="text-white font-semibold">{resultado.periodosEliminados}</p>
                        </div>
                    </div>
                    {resultado.jefesNoResueltos.length > 0 && (
                        <div className="text-sm text-amber-300">
                            <p className="font-medium mb-1">{resultado.jefesNoResueltos.length} jefes mencionados en el archivo que no se encontraron como empleado (se dejó el vínculo previo, si existía):</p>
                            <ul className="text-white/60 text-xs space-y-0.5 max-h-32 overflow-y-auto">
                                {resultado.jefesNoResueltos.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                        </div>
                    )}
                    {resultado.filasInvalidas.length > 0 && (
                        <div className="text-sm text-amber-300">
                            <p className="font-medium mb-1">{resultado.filasInvalidas.length} filas con datos incompletos (se omitieron):</p>
                            <ul className="text-white/60 text-xs space-y-0.5 max-h-32 overflow-y-auto">
                                {resultado.filasInvalidas.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function formatearFechaHora(iso: string): string {
    return new Date(iso).toLocaleString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

function SeccionHistorial() {
    const [items, setItems] = useState<HistorialCargaItem[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandido, setExpandido] = useState<string | null>(null);

    function cargar() {
        setCargando(true);
        setError(null);
        obtenerHistorialCargas()
            .then(setItems)
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado al cargar el historial'))
            .finally(() => setCargando(false));
    }

    useEffect(() => {
        cargar();
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-white/60 text-sm">Registro de todas las cargas hechas en este panel (correos de jefes y reporte de vacaciones). No se borran.</p>
                <button
                    type="button"
                    onClick={cargar}
                    disabled={cargando}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 cursor-pointer"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
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

            {!cargando && !error && items.length === 0 && (
                <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                    <p className="text-white/60 text-sm">Todavía no se ha hecho ninguna carga.</p>
                </div>
            )}

            {!cargando && !error && items.length > 0 && (
                <div className="space-y-2">
                    {items.map((item) => {
                        const abierto = expandido === item.id;
                        return (
                            <div key={item.id} className={`${GLASS} rounded-xl overflow-hidden`}>
                                <button
                                    type="button"
                                    onClick={() => setExpandido(abierto ? null : item.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
                                >
                                    <div className={`p-2 rounded-lg ${item.tipo === 'correos_jefes' ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`}>
                                        {item.tipo === 'correos_jefes' ? <Mail className="w-4 h-4 text-blue-300" /> : <FileClock className="w-4 h-4 text-emerald-300" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{item.nombreArchivo}</p>
                                        <p className="text-white/50 text-xs">
                                            {item.tipo === 'correos_jefes' ? 'Correos de jefes' : 'Reporte de vacaciones'} · {item.adminNombre} · {formatearFechaHora(item.createdAt)} · {item.filasLeidas} filas
                                        </p>
                                    </div>
                                    <span className="text-white/40 text-xs">{abierto ? '−' : '+'}</span>
                                </button>
                                {abierto && (
                                    <div className="px-4 pb-4 space-y-2 border-t border-white/10 pt-3">
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(item.resumen).map(([clave, valor]) => (
                                                <span key={clave} className="text-xs bg-white/5 rounded-lg px-2.5 py-1 text-white/80">
                                                    {clave}: <span className="font-semibold text-white">{valor}</span>
                                                </span>
                                            ))}
                                        </div>
                                        {item.avisos.length > 0 && (
                                            <div className="text-sm text-amber-300">
                                                <p className="font-medium mb-1">{item.avisos.length} avisos:</p>
                                                <ul className="text-white/60 text-xs space-y-0.5 max-h-32 overflow-y-auto">
                                                    {item.avisos.map((a, i) => <li key={i}>{a}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function SeccionSolicitudes() {
    const [estatus, setEstatus] = useState<EstatusSolicitud>('pendiente');
    const [pagina, setPagina] = useState(1);
    const [datos, setDatos] = useState<SolicitudPorEstatus[]>([]);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setPagina(1);
    }, [estatus]);

    useEffect(() => {
        setCargando(true);
        setError(null);
        obtenerSolicitudesPorEstatus(estatus, pagina)
            .then((res) => {
                setDatos(res.datos);
                setTotal(res.total);
            })
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    }, [estatus, pagina]);

    const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

    return (
        <div className="space-y-4">
            <div className={`flex gap-2 ${GLASS} p-1.5 rounded-2xl w-fit`}>
                {ESTATUS_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setEstatus(tab.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                            estatus === tab.id
                                ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow'
                                : 'text-white/70 hover:bg-white/10'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
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

            {!cargando && !error && datos.length === 0 && (
                <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                    <p className="text-white/60 text-sm">No hay solicitudes {ESTATUS_TABS.find((t) => t.id === estatus)?.label.toLowerCase()}.</p>
                </div>
            )}

            {!cargando && !error && datos.length > 0 && (
                <div className={`${GLASS} rounded-2xl overflow-hidden`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wide">
                                    <th className="text-left px-5 py-3">Empleado</th>
                                    <th className="text-left px-5 py-3">Departamento</th>
                                    <th className="text-left px-5 py-3">Días</th>
                                    <th className="text-left px-5 py-3">Solicitada</th>
                                    <th className="text-left px-5 py-3">Resuelta</th>
                                    {estatus === 'rechazada' && <th className="text-left px-5 py-3">Motivo</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {datos.map((s) => (
                                    <tr key={s.id} className="text-white/90">
                                        <td className="px-5 py-3">
                                            <div>{s.nombre}</div>
                                            <div className="text-xs text-white/40">#{s.numeroEmpleado}</div>
                                        </td>
                                        <td className="px-5 py-3 text-white/70">{s.departamento ?? '—'}</td>
                                        <td className="px-5 py-3">{s.cantidadDias}</td>
                                        <td className="px-5 py-3 text-white/70">{formatearFecha(s.createdAt)}</td>
                                        <td className="px-5 py-3 text-white/70">{formatearFecha(s.resueltoAt)}</td>
                                        {estatus === 'rechazada' && (
                                            <td className="px-5 py-3 text-white/70">{s.motivoRechazo ?? '—'}</td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setPagina((p) => p - 1)}
                        disabled={pagina === 1}
                        className={`${GLASS} p-1.5 rounded-lg text-white/70 hover:bg-white/20 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed`}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-white/60 text-xs">Página {pagina} de {totalPaginas}</span>
                    <button
                        type="button"
                        onClick={() => setPagina((p) => p + 1)}
                        disabled={pagina === totalPaginas}
                        className={`${GLASS} p-1.5 rounded-lg text-white/70 hover:bg-white/20 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed`}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

// Devuelve el "Desde"/"Hasta" (YYYY-MM-DD) de la quincena en curso, según la fecha de hoy:
// del 1 al 15, o del 16 al último día del mes.
function quincenaActual(): { desde: string; hasta: string } {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();
    const dia = hoy.getDate();
    const pad = (n: number) => String(n).padStart(2, '0');

    if (dia <= 15) {
        return { desde: `${anio}-${pad(mes + 1)}-01`, hasta: `${anio}-${pad(mes + 1)}-15` };
    }
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    return { desde: `${anio}-${pad(mes + 1)}-16`, hasta: `${anio}-${pad(mes + 1)}-${pad(ultimoDia)}` };
}

function SeccionReportes() {
    const [descargando, setDescargando] = useState<EstatusSolicitud | null>(null);
    const [error, setError] = useState<string | null>(null);

    const defaultQuincena = quincenaActual();
    const [desde, setDesde] = useState(defaultQuincena.desde);
    const [hasta, setHasta] = useState(defaultQuincena.hasta);
    const [descargandoPeriodo, setDescargandoPeriodo] = useState(false);
    const [errorPeriodo, setErrorPeriodo] = useState<string | null>(null);

    async function descargar(estatus: EstatusSolicitud) {
        setDescargando(estatus);
        setError(null);
        try {
            await descargarReporteSolicitudes(estatus);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado al descargar el reporte');
        } finally {
            setDescargando(null);
        }
    }

    async function descargarPeriodo() {
        setDescargandoPeriodo(true);
        setErrorPeriodo(null);
        try {
            await descargarReporteVacacionesPeriodo(desde, hasta);
        } catch (err) {
            setErrorPeriodo(err instanceof ApiError ? err.message : 'Error inesperado al descargar el reporte');
        } finally {
            setDescargandoPeriodo(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className={`${GLASS} rounded-2xl p-6 space-y-4`}>
                <div>
                    <h3 className="text-white font-semibold">Reportes de solicitudes</h3>
                    <p className="text-white/60 text-sm mt-1">Descarga el listado completo en Excel según el estatus.</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-200 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex flex-wrap gap-3">
                    {ESTATUS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => descargar(tab.id)}
                            disabled={descargando !== null}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {descargando === tab.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`${GLASS} rounded-2xl p-6 space-y-4`}>
                <div>
                    <h3 className="text-white font-semibold">Reporte de vacaciones general (para SAP)</h3>
                    <p className="text-white/60 text-sm mt-1">
                        Descarga el reporte en el mismo formato de columnas que se usa para subir a SAP, con los días
                        disfrutados actualizados según las solicitudes aprobadas localmente en el periodo.
                    </p>
                </div>

                {errorPeriodo && (
                    <div className="flex items-center gap-2 text-red-200 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorPeriodo}</span>
                    </div>
                )}

                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="block text-white/60 text-xs mb-1">Desde</label>
                        <input
                            type="date"
                            value={desde}
                            onChange={(e) => setDesde(e.target.value)}
                            className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 [color-scheme:dark]"
                        />
                    </div>
                    <div>
                        <label className="block text-white/60 text-xs mb-1">Hasta</label>
                        <input
                            type="date"
                            value={hasta}
                            onChange={(e) => setHasta(e.target.value)}
                            className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 [color-scheme:dark]"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={descargarPeriodo}
                        disabled={descargandoPeriodo || !desde || !hasta}
                        className="flex items-center gap-2 bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {descargandoPeriodo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Descargar
                    </button>
                </div>
            </div>
        </div>
    );
}

export function AdminNominasPage() {
    const { admin } = useAdminAuth();
    const location = useLocation();
    const seccion: Seccion = RUTA_POR_SECCION[location.pathname] ?? 'correos';

    return (
        <div className="space-y-6">
            <section className="bg-linear-to-r from-[#4a8b2c] to-[#ee7624] p-8 rounded-2xl shadow-lg text-white">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-4 rounded-full">
                        <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Panel de Nóminas</h1>
                        <p className="text-white/80 text-sm">
                            {admin ? `Bienvenido, ${admin.nombre}` : 'Panel de nóminas'}
                        </p>
                    </div>
                </div>
            </section>

            {seccion === 'correos' && <SeccionCorreosJefes />}
            {seccion === 'vacaciones' && <SeccionReporteVacaciones />}
            {seccion === 'historial' && <SeccionHistorial />}
            {seccion === 'solicitudes' && <SeccionSolicitudes />}
            {seccion === 'reportes' && <SeccionReportes />}
        </div>
    );
}
