
import { Building2 } from 'lucide-react';
import { GLASS } from '../../utils/estilos';
import { ESTILOS_ESTADO, type DepartamentoResumen } from './utils';
import type { EstadoSaldo } from '../../api/jefe';

export const TablaDepartamentos = ({ departamentos, filtro, onSeleccionar }: { departamentos: DepartamentoResumen[]; filtro: 'todos' | 'vencido' | 'critico'; onSeleccionar: (departamento: string) => void }) => {
    const mostrarVencidos = filtro === 'todos' || filtro === 'vencido';
    const mostrarPorVencer = filtro === 'todos' || filtro === 'critico';

    return (
        <div className={`${GLASS} rounded-2xl overflow-hidden`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-linear-to-r from-[#4a8b2c]/30 to-[#ee7624]/20 border-b border-white/20">
                            <th className="text-left px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Departamento</th>
                            <th className="text-center px-4 py-3 font-semibold text-white/90 uppercase tracking-wide text-xs">Empleados</th>
                            {mostrarVencidos && (
                                <th className="text-center px-4 py-3 font-semibold text-red-200 uppercase tracking-wide text-xs whitespace-nowrap">Días vencidos</th>
                            )}
                            {mostrarPorVencer && (
                                <th className="text-center px-4 py-3 font-semibold text-amber-200 uppercase tracking-wide text-xs whitespace-nowrap">Días por vencer</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {departamentos.map((d, indice) => {
                            const peorEstado: EstadoSaldo = d.porEstado.vencido.cantidad > 0 ? 'vencido' : 'critico';
                            const estilo = ESTILOS_ESTADO[peorEstado];
                            return (
                                <tr
                                    key={d.departamento}
                                    onClick={() => onSeleccionar(d.departamento)}
                                    className={`cursor-pointer transition-colors hover:bg-white/15 border-l-4 ${estilo.borde} ${
                                        indice % 2 === 1 ? 'bg-white/5' : ''
                                    }`}
                                >
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-2.5 min-w-[11rem]">
                                            <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-white/15 text-white">
                                                <Building2 size={14} />
                                            </div>
                                            <p className="text-white font-medium truncate">{d.departamento}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-center text-white/80">{d.empleados.length}</td>
                                    {mostrarVencidos && (
                                        <td className={`px-4 py-3.5 text-center font-bold ${d.porEstado.vencido.cantidad > 0 ? 'text-red-300' : 'text-white/25'}`}>
                                            {d.porEstado.vencido.dias || '—'}
                                        </td>
                                    )}
                                    {mostrarPorVencer && (
                                        <td className={`px-4 py-3.5 text-center font-bold ${d.porEstado.critico.cantidad > 0 ? 'text-amber-300' : 'text-white/25'}`}>
                                            {d.porEstado.critico.dias || '—'}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};