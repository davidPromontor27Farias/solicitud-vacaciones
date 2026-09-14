import { AlertTriangle, Clock, CalendarDays, Building2, Search, RefreshCw, AlertCircle, ShieldCheck, LayoutGrid, List } from 'lucide-react';
import { GLASS } from '../utils/estilos';
import { useAdminDashboardPage, type Filtro } from '../hooks/useAdminDashboardPage';
import { TarjetaResumen } from '../components/vacacionesCriticas/TarjetaResumen';
import { TarjetaTopDepartamento } from '../components/vacacionesCriticas/TarjetaTopDepartamento';
import { VistaDepartamentos } from '../components/vacacionesCriticas/VistaDepartamentos';
import { VistaEmpleados } from '../components/vacacionesCriticas/VistaEmpleados';
import { VistaDetalleEmpleado } from '../components/vacacionesCriticas/VistaDetalleEmpleado';
import { VistaListado } from '../components/vacacionesCriticas/VistaListado';

export function AdminDashboardPage() {
    const {
        seccion,
        items, cargando, error,
        busqueda, setBusqueda,
        filtro, setFiltro,
        modoVista, setModoVista,
        departamentoSeleccionado, setDepartamentoSeleccionado,
        paginaDepartamentos, setPaginaDepartamentos,
        paginaEmpleados, setPaginaEmpleados,
        empleadoSeleccionado, setEmpleadoSeleccionado,
        filtroDetalle, setFiltroDetalle,
        detalleEmpleado, cargandoDetalle, errorDetalle,
        filtrados, vencidos, criticos,
        totalDiasVencidos, totalDiasCriticos, empleadosAfectados,
        itemsActivos, esVencidoActivo,
        departamentosActivos, topDepartamentoVencido, topDepartamentoCritico, grupoSeleccionado,
    } = useAdminDashboardPage();

    const FILTROS: { id: Filtro; label: string; icono: React.ReactNode; cantidad: number }[] = [
        { id: 'vencido', label: 'Vencidos', icono: <AlertTriangle size={14} />, cantidad: vencidos.length },
        { id: 'critico', label: 'Por vencer', icono: <Clock size={14} />, cantidad: criticos.length },
    ];

    return (
        <div className="space-y-6">
            {seccion === 'dashboards' && (
                <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center py-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
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
                        <TarjetaTopDepartamento
                            icono={<Building2 className="w-5 h-5 text-red-300" />}
                            etiqueta="Depto. con más días vencidos"
                            resumen={topDepartamentoVencido}
                            texto="text-red-300"
                        />
                        <TarjetaTopDepartamento
                            icono={<Building2 className="w-5 h-5 text-amber-300" />}
                            etiqueta="Depto. con más días por vencer"
                            resumen={topDepartamentoCritico}
                            texto="text-amber-300"
                        />
                    </div>
                </div>
            )}

            {seccion === 'registros' && (
            <div className="space-y-6">
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
                    <p className="text-white/60 text-sm mt-1">No hay saldos vencidos ni próximos a vencer en los proximos 6 meses</p>
                </div>
            )}

            {!cargando && !error && items.length > 0 && filtrados.length === 0 && (
                <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                    <Search className="w-10 h-10 text-white/40 mx-auto mb-3" />
                    <p className="text-white/60 text-sm">Sin resultados para "{busqueda}".</p>
                </div>
            )}

            {!cargando && !error && filtrados.length > 0 && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className={`flex gap-2 ${GLASS} p-1.5 rounded-2xl w-fit`}>
                            <button
                                type="button"
                                onClick={() => setModoVista('tarjetas')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                                    modoVista === 'tarjetas'
                                        ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow'
                                        : 'text-white/70 hover:bg-white/10'
                                }`}
                            >
                                <LayoutGrid size={14} />
                                Cuadricula
                            </button>
                            <button
                                type="button"
                                onClick={() => setModoVista('listado')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                                    modoVista === 'listado'
                                        ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow'
                                        : 'text-white/70 hover:bg-white/10'
                                }`}
                            >
                                <List size={14} />
                                Listado
                            </button>
                        </div> 


                        {modoVista === 'tarjetas' && !empleadoSeleccionado && (
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
                        )}
                    </div>

                    {empleadoSeleccionado ? (
                        <VistaDetalleEmpleado
                            detalle={detalleEmpleado}
                            cargando={cargandoDetalle}
                            error={errorDetalle}
                            filtro={filtroDetalle}
                            onVolver={() => setEmpleadoSeleccionado(null)}
                        />
                    ) : modoVista === 'listado' ? (
                        <VistaListado
                            vencidos={vencidos}
                            criticos={criticos}
                            onSeleccionarEmpleado={(id, estado) => {
                                setFiltroDetalle(estado);
                                setEmpleadoSeleccionado(id);
                            }}
                        />
                    ) : itemsActivos.length === 0 ? (
                        <div className={`${GLASS} p-10 rounded-2xl text-center`}>
                            <ShieldCheck className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                            <p className="text-white/60 text-sm">
                                {esVencidoActivo ? 'No hay saldos vencidos.' : 'No hay saldos por vencer en los próximos 6 meses.'}
                            </p>
                        </div>
                    ) : departamentoSeleccionado ? (
                        <VistaEmpleados
                            departamento={departamentoSeleccionado}
                            items={grupoSeleccionado?.items ?? []}
                            pagina={paginaEmpleados}
                            onPaginaChange={setPaginaEmpleados}
                            onVolver={() => setDepartamentoSeleccionado(null)}
                            onSeleccionarEmpleado={(id) => { setFiltroDetalle(filtro); setEmpleadoSeleccionado(id); }}
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
            )}
        </div>
    );
}