import { Upload, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GLASS } from './estilos';
import { useReporteVacaciones } from '../../hooks/useReporteVacaciones';


export const SeccionReporteVacaciones = () => {
    const { archivo, setArchivo, subiendo, subir, error, resultado } = useReporteVacaciones();

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
}; 
