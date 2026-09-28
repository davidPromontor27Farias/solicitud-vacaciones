import { GLASS } from '../../utils/estilos';
import { construirFilaEquipo, formatearFecha, type EmpleadoConPeriodos, type FiltroSemaforo } from './utils';

const TH = 'text-center align-middle px-1.5 py-2.5 font-semibold text-white/90 uppercase tracking-wide text-[11px] leading-tight whitespace-nowrap';
const TD = 'px-1.5 py-2.5 text-center align-middle whitespace-nowrap text-xs sm:text-sm';

export const TablaEquipo = ({ 
        empleados, 
        filtro, 
        onCambiarFiltro, 
        SEMAFORO = []
    }: { 
        empleados: EmpleadoConPeriodos[]; 
        filtro: FiltroSemaforo;
        onCambiarFiltro?: (filtro: FiltroSemaforo) => void;
        SEMAFORO?: Array<{id: FiltroSemaforo; label: string; punto: string; cantidad: number}>;
    }) => {
    const filas = empleados.map(construirFilaEquipo);

    const mostrarBasicas = filtro === 'todos';
    const mostrarDisponibles = filtro === 'todos' || filtro === 'vigente';
    const mostrarPorVencer = filtro === 'todos' || filtro === 'critico';
    const mostrarVencidos = filtro === 'todos' || filtro === 'vencido';

    return (

        <div className='space-y-3'>
            {SEMAFORO.length > 0 && (
                <div className={`w-full ${GLASS} p-1.5 rounded-2xl border border-white/10 shadow-lg`}>
                    <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-1.5 w-full">
                    {SEMAFORO.map((s) => {
                        const isSelected = filtro === s.id;
                        return (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => onCambiarFiltro && onCambiarFiltro(s.id)}
                            className={`flex items-center justify-between gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 select-none w-full ${
                            isSelected
                                ? 'bg-gradient-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow-md shadow-[#4a8b2c]/20'
                                : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${s.punto}`} />
                            <span className="truncate">{s.label}</span>
                            </div>
                            
                            <span
                            className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                            }`}
                            >
                            {s.cantidad}
                            </span>
                        </button>
                        );
                    })}
                    </div>
                </div>
            )}
            {/**Contenedor de la tabla con SCROLL y columna fija */}
            <div className={`${GLASS} rounded-2xl overflow-hidden border border-white/10 shadow-xl`}>
                <div className='w-full overflow-x-auto touch-pan-x overscroll-x-contain no-scrollbar'>
                    <table className="w-max min-w-full text-sm divide-y divide-white/10">
                        <thead>
                            <tr className="bg-gradient-to-r from-[#4a8b2c]/30 to-[#ee7624]/20 border-b border-white/20">
                                <th className={`w-40 text-left align-middle px-2 py-2.5 font-semibold text-white/90 uppercase tracking-wide text-[11px] leading-tight`}>Empleado</th>
                              
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
                                    <td className="px-2 py-2.5 align-middle">
                                        <p className="text-white font-medium text-[13px] leading-tight break-words">{fila.nombre}</p>
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
                                            <td className={`${TD} text-emerald-300 font-semibold`}>
                                                {fila.otrosDisponibles}
                                            </td>
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
                    

        </div>
    );
};