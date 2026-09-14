import { GLASS } from '../../utils/estilos';
import { construirFilaEquipo, formatearFecha, iniciales, type EmpleadoConPeriodos } from './utils';

export const TablaEquipo = ({ empleados }: { empleados: EmpleadoConPeriodos[] }) => {
    const filas = empleados.map(construirFilaEquipo);

    return (
        <div className={`${GLASS} rounded-2xl overflow-hidden`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-linear-to-r from-[#4a8b2c]/30 to-[#ee7624]/20 border-b border-white/20">
                            <th className="text-left px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Empleado</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Total</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Tomados</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Disponibles</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Fecha vencimiento</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Vencidos</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Fecha vencimiento</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Por vencer</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Fecha vencimiento</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {filas.map((fila, indice) => (
                            <tr key={fila.empleadoId} className={indice % 2 === 1 ? 'bg-white/5' : ''}>
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-2.5 min-w-[11rem]">
                                        <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-semibold text-[11px] bg-white/15 text-white">
                                            {iniciales(fila.nombre)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-medium truncate">{fila.nombre}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 text-center text-white/90 font-semibold">{fila.total}</td>
                                <td className="px-4 py-3.5 text-center text-white/90 font-semibold">{fila.tomados}</td>
                                <td className="px-4 py-3.5 text-center text-emerald-300 font-semibold">{fila.disponibles}</td>
                                <td className={`px-4 py-3.5 text-center whitespace-nowrap ${fila.fechaDisponibles ? 'text-emerald-200/80' : 'text-white/40'}`}>
                                    {fila.fechaDisponibles ? formatearFecha(fila.fechaDisponibles) : '—'}
                                </td>
                                <td className={`px-4 py-3.5 text-center font-bold ${fila.vencidos > 0 ? 'text-red-300' : 'text-white/40'}`}>
                                    {fila.vencidos}
                                </td>
                                <td className={`px-4 py-3.5 text-center whitespace-nowrap ${fila.fechaVencido ? 'text-red-300' : 'text-white/40'}`}>
                                    {fila.fechaVencido ? formatearFecha(fila.fechaVencido) : '—'}
                                </td>
                                <td className={`px-4 py-3.5 text-center font-bold ${fila.porVencer > 0 ? 'text-amber-300' : 'text-white/40'}`}>
                                    {fila.porVencer}
                                </td>
                                <td className={`px-4 py-3.5 text-center whitespace-nowrap ${fila.fechaPorVencer ? 'text-amber-300' : 'text-white/40'}`}>
                                    {fila.fechaPorVencer ? formatearFecha(fila.fechaPorVencer) : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
