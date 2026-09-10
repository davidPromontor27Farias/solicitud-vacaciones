import { FileSpreadsheet, Download, RefreshCw, AlertCircle} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
    descargarReporteSolicitudes,
    descargarReporteVacacionesPeriodo,
    type EstatusSolicitud,
} from '../api/admin';
import { ApiError } from '../api/client';
import { SeccionCorreosJefes } from '../components/nominas/SeccionCorreosJefes';
import {SeccionReporteVacaciones} from '../components/nominas/SeccionReporteVacaciones';
import { GLASS } from '../components/nominas/estilos';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SeccionHistorial } from '../components/nominas/SeccionHistorial';
import { ESTATUS_TABS } from '../components/nominas/constantes';
import { SeccionSolicitudes } from '../components/nominas/SeccionSolicitudes';
type Seccion = 'correos' | 'vacaciones' | 'historial' | 'solicitudes' | 'reportes';

// Mismas rutas que usan los enlaces de navegación en AdminLayout.
const RUTA_POR_SECCION: Record<string, Seccion> = {
    '/admin': 'correos',
    '/admin/reporte-vacaciones': 'vacaciones',
    '/admin/historial-cargas': 'historial',
    '/admin/nomina-solicitudes': 'solicitudes',
    '/admin/nomina-reportes': 'reportes',
};



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
