import { GLASS } from '../../utils/estilos';
import { construirFilaEquipo, formatearFecha, iniciales, type EmpleadoConPeriodos, type FiltroSemaforo } from './utils';

const TH = 'text-center px-1.5 py-2.5 font-semibold text-white/90 uppercase tracking-wide text-[11px] leading-tight';
const TD = 'px-1.5 py-2.5 text-center align-middle';

export const TablaEquipo = ({ empleados, filtro }: { empleados: EmpleadoConPeriodos[]; filtro: FiltroSemaforo }) => {
    const filas = empleados.map(construirFilaEquipo);

    const mostrarBasicas = filtro === 'todos';
    const mostrarDisponibles = filtro === 'todos' || filtro === 'vigente';
    const mostrarPorVencer = filtro === 'todos' || filtro === 'critico';
    const mostrarVencidos = filtro === 'todos' || filtro === 'vencido';

    return (
        <div className={`${GLASS} rounded-2xl overflow-hidden`}>
            <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                    <thead>
                        <tr className="bg-linear-to-r from-[#4a8b2c]/30 to-[#ee7624]/20 border-b border-white/20">
                            <th className={`w-40 text-left px-2 py-2.5 font-semibold text-white/90 uppercase tracking-wide text-[11px] leading-tight`}>Empleado</th>
                            {mostrarBasicas && (
                                <>
                                    <th className={TH}>Días generados</th>
                                    <th className={TH}>Días disfrutados</th>
                                </>
                            )}
                            {mostrarDisponibles && (
                                <th className={TH}>Días disponibles</th>
                            )}
                            {mostrarPorVencer && (
                                <>
                                    <th className={TH}>Por vencer</th>
                                    <th className={TH}>Tomar antes del</th>
                                    <th className={TH}>Otros disponibles</th>
                                    <th className={TH}>Próxima fecha límite</th>
                                    <th className={TH}>Días programados</th>
                                </>
                            )}
                            {mostrarVencidos && (
                                <>
                                    <th className={TH}>Días vencidos</th>
                                    <th className={TH}>Días rechazados</th>
                                    <th className={TH}>Fecha de vencimiento</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {filas.map((fila, indice) => (
                            <tr key={fila.empleadoId} className={indice % 2 === 1 ? 'bg-white/5' : ''}>
                                <td className="px-2 py-2.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-semibold text-[10px] bg-white/15 text-white">
                                            {iniciales(fila.nombre)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-medium truncate text-[13px]">{fila.nombre}</p>
                                        </div>
                                    </div>
                                </td>
                                {mostrarBasicas && (
                                    <>
                                        <td className={`${TD} text-white/90 font-semibold`}>{fila.total}</td>
                                        <td className={`${TD} text-white/90 font-semibold`}>{fila.tomados}</td>
                                    </>
                                )}
                                {mostrarDisponibles && (
                                    <td className={`${TD} text-white/90 font-semibold`}>{fila.disponibles}</td>
                                )}
                                {mostrarPorVencer && (
                                    <>
                                        <td className={`${TD} font-bold ${fila.porVencer > 0 ? 'text-amber-300' : 'text-white/40'}`}>
                                            {fila.porVencer}
                                        </td>
                                        <td className={`${TD} text-xs ${fila.fechaPorVencer ? 'text-amber-300' : 'text-white/40'}`}>
                                            {fila.fechaPorVencer ? formatearFecha(fila.fechaPorVencer) : '—'}
                                        </td>
                                        <td className={`${TD} text-emerald-300 font-semibold`}>{fila.otrosDisponibles}</td>
                                        <td className={`${TD} text-xs ${fila.fechaProximaLimite ? 'text-emerald-200/80' : 'text-white/40'}`}>
                                            {fila.fechaProximaLimite ? formatearFecha(fila.fechaProximaLimite) : '—'}
                                        </td>
                                        <td className={`${TD} font-semibold ${fila.programados > 0 ? 'text-sky-300' : 'text-white/40'}`}>
                                            {fila.programados}
                                        </td>
                                    </>
                                )}
                                {mostrarVencidos && (
                                    <>
                                        <td className={`${TD} font-bold ${fila.vencidos > 0 ? 'text-red-300' : 'text-white/40'}`}>
                                            {fila.vencidos}
                                        </td>
                                        <td className={`${TD} font-semibold ${fila.rechazados > 0 ? 'text-red-300' : 'text-white/40'}`}>
                                            {fila.rechazados}
                                        </td>
                                        <td className={`${TD} text-xs ${fila.fechaVencido ? 'text-red-300' : 'text-white/40'}`}>
                                            {fila.fechaVencido ? formatearFecha(fila.fechaVencido) : '—'}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
