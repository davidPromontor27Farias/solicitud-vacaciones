import { Building2 } from 'lucide-react';
import { GLASS } from '../../utils/estilos';
import { ESTILOS_ESTADO, formatearFecha, iniciales, type EmpleadoCercano } from './utils';

export const TablaEmpleadosCercanos = ({ empleados, onSeleccionar }: { empleados: EmpleadoCercano[]; onSeleccionar: (id: string) => void }) => {
    return (
        <div className={`${GLASS} rounded-2xl overflow-hidden`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-linear-to-r from-[#4a8b2c]/30 to-[#ee7624]/20 border-b border-white/20">
                            <th className="text-left px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Empleado</th>
                            <th className="text-left px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Departamento</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Días</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Status</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {empleados.map((e, indice) => {
                            const estilo = ESTILOS_ESTADO[e.estado];
                            return (
                                <tr
                                    key={e.empleadoId}
                                    onClick={() => onSeleccionar(e.empleadoId)}
                                    className={`cursor-pointer transition-colors hover:bg-white/15 border-l-4 ${estilo.borde} ${
                                        indice % 2 === 1 ? 'bg-white/5' : ''
                                    }`}
                                >
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-2.5 min-w-[11rem]">
                                            <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-semibold text-[11px] bg-white/15 text-white">
                                                {iniciales(e.nombre)}
                                            </div>
                                            <p className="text-white font-medium truncate">{e.nombre}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-white/80 whitespace-nowrap">
                                        <span className="flex items-center gap-1.5">
                                            <Building2 size={12} className="text-white/40 shrink-0" />
                                            {e.departamento}
                                        </span>
                                    </td>
                                    <td className={`px-4 py-3.5 text-center font-bold ${estilo.texto}`}>{e.dias}</td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 ${estilo.texto}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${estilo.punto}`} />
                                            {estilo.etiqueta}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center text-white/70 whitespace-nowrap">{formatearFecha(e.fecha)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};