import { Download, RefreshCw, AlertCircle } from 'lucide-react';
import { ESTATUS_TABS } from './constantes';
import { GLASS } from './estilos';
import { useReportesDescarga } from '../../hooks/useReporteDescarga';

export const SeccionReportes = () => {
    const {
        descargando, error, descargar,
        desde, setDesde, hasta, setHasta,
        descargandoPeriodo, errorPeriodo, descargarPeriodo,
    } = useReportesDescarga();

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
};