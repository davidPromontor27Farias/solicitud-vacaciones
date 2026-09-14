import { Navigate } from 'react-router-dom';
import { RefreshCw, AlertCircle, Building2 } from 'lucide-react';
import { GLASS } from '../utils/estilos';
import { useJefeMatricialPage } from '../hooks/useJefeMatricialPage';
import { FilaArbol } from '../components/matricial/FilaArbol';
import { PanelDetalle } from '../components/matricial/PanelDetalle';

export function JefeMatricialPage() {
    const { jefe, arbol, cargando, error, nodoSeleccionado, setNodoSeleccionado } = useJefeMatricialPage();

    if (!jefe?.tieneMatricial) {
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

    if (!arbol) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-white">
                <Building2 className="w-5 h-5 text-white/70" />
                <h1 className="text-lg font-semibold">Matricial</h1>
            </div>

            {nodoSeleccionado && (
                <PanelDetalle nodo={nodoSeleccionado} onCerrar={() => setNodoSeleccionado(null)} />
            )}

            <div className={`${GLASS} rounded-2xl overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-linear-to-r from-[#4a8b2c]/30 to-[#ee7624]/20 border-b border-white/20">
                                <th className="text-left px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Empleado</th>
                                <th className="text-left px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Puesto</th>
                                <th className="text-left px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Departamento</th>
                                <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Status</th>
                                <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Días</th>
                                <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Fecha límite</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            <FilaArbol nodo={arbol} nivel={0} onSeleccionar={setNodoSeleccionado} />
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
