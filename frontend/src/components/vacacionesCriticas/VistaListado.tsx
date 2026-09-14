import { AlertTriangle, Clock, RefreshCw, Download, AlertCircle } from 'lucide-react';
import { GLASS } from '../../utils/estilos';
import { SeccionListado } from './SeccionListado';
import { useFiltrosListado } from '../../hooks/useFiltrosListado';
import type { VacacionCritica } from '../../api/admin';

type Filtro = 'vencido' | 'critico';

export const VistaListado = ({ vencidos, criticos, onSeleccionarEmpleado }: {
    vencidos: VacacionCritica[];
    criticos: VacacionCritica[];
    onSeleccionarEmpleado: (empleadoId: string, estado: Filtro) => void;
}) => {
    const {
        sociedad, setSociedad, departamento, setDepartamento,
        sociedades, departamentos,
        descargando, errorDescarga, exportarExcel,
        aplicarFiltros, hayFiltros, limpiarFiltros,
    } = useFiltrosListado(vencidos, criticos);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <select
                    value={sociedad}
                    onChange={(e) => setSociedad(e.target.value)}
                    className={`${GLASS} rounded-xl px-3.5 py-2 text-sm text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer [&>option]:text-gray-900`}
                >
                    <option value="">Todas las sociedades</option>
                    {sociedades.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                    className={`${GLASS} rounded-xl px-3.5 py-2 text-sm text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer [&>option]:text-gray-900`}
                >
                    <option value="">Todos los departamentos</option>
                    {departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {hayFiltros && (
                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="text-sm text-white/60 hover:text-white underline cursor-pointer"
                    >
                        Quitar filtros
                    </button>
                )}
                <button
                    type="button"
                    onClick={exportarExcel}
                    disabled={descargando}
                    className={`ml-auto flex items-center gap-1.5 ${GLASS} rounded-xl px-3.5 py-2 text-sm text-white hover:bg-white/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {descargando ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                    {descargando ? 'Generando...' : 'Exportar a Excel'}
                </button>
            </div>
            {errorDescarga && (
                <div className={`${GLASS} p-3 rounded-xl text-red-200 text-sm flex items-center gap-2`}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorDescarga}</span>
                </div>
            )}

            <SeccionListado
                titulo="Vencidos"
                icono={<AlertTriangle size={16} className="text-red-300" />}
                items={aplicarFiltros(vencidos)}
                esVencido
                onSeleccionar={(id) => onSeleccionarEmpleado(id, 'vencido')}
            />
            <SeccionListado
                titulo="Próximos a vencer"
                icono={<Clock size={16} className="text-amber-300" />}
                items={aplicarFiltros(criticos)}
                esVencido={false}
                onSeleccionar={(id) => onSeleccionarEmpleado(id, 'critico')}
            />
        </div>
    );
};
