import { Navigate } from 'react-router-dom';
import { RefreshCw, AlertCircle, ShieldCheck, Building2, ChevronLeft } from 'lucide-react';
import { GLASS } from '../utils/estilos';
import { useJefeTodosDepartamentosPage } from '../hooks/useJefeTodosDepartamentosPage';
import { TablaDepartamentos } from '../components/todosDepartamentos/TablaDepartamentos';
import { TablaEmpleadosCercanos } from '../components/todosDepartamentos/TablaEmpleadosCercanos';
import { VistaDetalleEmpleado } from '../components/todosDepartamentos/VistaDetalleEmpleado';

export function JefeTodosDepartamentosPage() {
    const {
        jefe, cargando, error,
        filtro, setFiltro,
        setDepartamentoSeleccionado,
        setEmpleadoSeleccionado,
        filtroDepartamentos, setFiltroDepartamentos,
        departamentosRiesgo, departamentosFiltrados,
        empleadoDetalle, departamentoActivo,
        empleadosCercanosDelDepartamento,
        SEMAFORO, SEMAFORO_DEPARTAMENTOS,
    } = useJefeTodosDepartamentosPage();

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