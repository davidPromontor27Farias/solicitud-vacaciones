import { CalendarDays, TrendingUp, TrendingDown, XCircle } from 'lucide-react';
import type { PerfilEmpleado } from '../../api/empleados';

const ESTADO_SALDO_ESTILOS: Record<string, { bg: string; text: string; label: string }> = {
    disponible: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'Vigente' },
    proximo: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Próximo a liberar' },
    vencido: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Vencido' },
};

export const SaldoVacaciones = ({ perfil }: { perfil: PerfilEmpleado | null }) => {
    return (
        <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100">

            {/**Encabezado */}
            <div className='flex items-center gap-2 mb-4'>
                <div className='p-2 bg-[#4a8b2c]/10 rounded-lg'>
                    <CalendarDays className='w-5 h-5 text-[#4a8b2c]'/>
                </div>

                <h2 className='text-base sm:text-lg font-bold text-gray-900'>
                    Saldo de Vacaciones
                </h2>
            </div> 

            {perfil ? (
            <div className='transition-opacity duration-300 starting:opacity-0'>
                {/**Tarjetas resumen del perfil */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">

                <div className="bg-linear-to-br from-[#4a8b2c]/5 to-[#4a8b2c]/10 p-4 rounded-xl border border-[#4a8b2c]/20">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 line-clamp-1">Días disponibles</span>
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#4a8b2c] shrink-0" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold  text-[#4a8b2c] mt-1 sm:mt-2">{perfil.totalPendientes}</p>
                </div>

                <div className="bg-linear-to-br from-blue-500/5 to-blue-500/10 p-3 sm:p-4 rounded-xl border border-blue-500/20">
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-sm text-gray-600">Programadas</span>
                        <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">{perfil.totalProgramados}</p>
                </div>

                <div className="bg-linear-to-br from-[#ee7624]/5 to-[#ee7624]/10 p-3 sm:p-4 rounded-xl border border-[#ee7624]/20">
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-xs sm:text-sm  text-gray-600 line-clamp-1">Días disfrutados</span>
                    <TrendingDown className="w-5 h-5 text-[#ee7624]" />
                    </div>
                    <p className="text-3xl font-bold text-[#ee7624] mt-2">{perfil.totalDisfrutados}</p>
                </div>


                <div className="bg-linear-to-br from-red-500/5 to-red-500/10 p-3 sm:p-4 rounded-xl border border-red-500/20">
                    <div className="flex items-center justify-between gap-1">
                    <span className="text-sm text-gray-600">Revocados por tu jefe</span>
                    <XCircle className="w-4 h-4 sm:text-sm text-red-600 shrink-0" />
                    </div>
                    <p className="text-2xl font-bold sm:text-3xl text-red-600 mt-1 sm:mt-2">{perfil.diasRevocadosPorJefeDirecto}</p>
                </div>
                </div>

                {/**Vista MOVIL: Tarjetas por periodo (Visible solo en < md) */}
                <div className="space-y-3 md:hidden">
                    {perfil.saldos.map((s, i) => {
                    const estadoEstilo = ESTADO_SALDO_ESTILOS[s.estado];
                    const diasDisponibles = s.diasPorLey - s.diasDisfrutados - s.diasAprobados;

                    return (
                        <div
                        key={i}
                        className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80 space-y-2.5"
                        >
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                            <span className="font-bold text-gray-800 text-sm">
                            Periodo {s.anioInicio}-{s.anioFin}
                            </span>
                            <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${estadoEstilo.bg} ${estadoEstilo.text}`}
                            >
                            {estadoEstilo.label}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                            <span className="text-gray-500 block">Días por ley</span>
                            <span className="font-semibold text-gray-800">{s.diasPorLey}</span>
                            </div>
                            <div>
                            <span className="text-gray-500 block">Disfrutados</span>
                            <span className="font-semibold text-gray-700">{s.diasDisfrutados}</span>
                            </div>
                            <div>
                            <span className="text-gray-500 block">Programadas</span>
                            <span className="font-semibold text-[#4a8b2c]">{s.diasAprobados}</span>
                            </div>
                            <div>
                            <span className="text-gray-500 block">Disponibles</span>
                            <span className="font-bold text-[#ee7624]">{diasDisponibles}</span>
                            </div>
                        </div>
                        </div>
                    );
                    })}
                </div>

                {/**VISTA DESKTOP: TABLE COMPLETA  (VISIBLE SOLO EN >= md)*/}
                <div className="hidden overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="bg-linear-to-r from-[#4a8b2c] to-[#ee7624] divide-x divide-white/20">
                            <th className="font-semibold text-white py-2.5 px-4 text-left">Periodo</th>
                            <th className="font-semibold text-white py-2.5 px-4 text-left">Días por ley</th>
                            <th className="font-semibold text-white py-2.5 px-4 text-left">Disfrutados</th>
                            <th className="font-semibold text-white py-2.5 px-4 text-left">Programadas</th>
                            <th className="font-semibold text-white py-2.5 px-4 text-left">Días disponibles</th>
                            <th className="font-semibold text-white py-2.5 px-4 text-left">Estado</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {perfil.saldos.map((s, i) => {
                            const estadoEstilo = ESTADO_SALDO_ESTILOS[s.estado];
                            const diasDisponibles = s.diasPorLey - s.diasDisfrutados - s.diasAprobados;
                            return (
                            <tr key={i} className={`divide-x divide-gray-200 hover:bg-gray-50 transition-colors ${i % 2 === 1 ? 'bg-gray-50/60' : ''}`}>
                                <td className="py-2.5 px-4 text-gray-600">{s.anioInicio}-{s.anioFin}</td>
                                <td className="py-2.5 px-4 font-medium text-gray-800">{s.diasPorLey}</td>
                                <td className="py-2.5 px-4 text-gray-600">{s.diasDisfrutados}</td>
                                <td className="py-2.5 px-4 text-[#4a8b2c] font-medium">{s.diasAprobados}</td>
                                <td className="py-2.5 px-4 text-[#ee7624] font-semibold">{diasDisponibles}</td>
                                <td className="py-2.5 px-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${estadoEstilo.bg} ${estadoEstilo.text}`}>
                                    {estadoEstilo.label}
                                    </span>
                                </td>
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
            ) : (
            <p className="text-gray-500">Cargando saldo...</p>
            )}
        </section>
    );
};