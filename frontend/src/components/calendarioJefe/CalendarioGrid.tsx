import { GLASS } from '../../utils/estilos';
import { fechaISO, DIAS_SEMANA } from './utils';
import type { VacacionAprobadaEquipo } from '../../api/jefe';

export const CalendarioGrid = ({
    semanas, mes, hoy, vacacionesPorDia, estadoCriticoPorEmpleadoId, nombrePorEmpleadoId, onSeleccionarVacacion,
}: {
    semanas: Date[][];
    mes: number;
    hoy: string;
    vacacionesPorDia: Map<string, VacacionAprobadaEquipo[]>;
    estadoCriticoPorEmpleadoId: Map<string, 'vencido' | 'critico'>;
    nombrePorEmpleadoId: Map<string, string>;
    onSeleccionarVacacion: (v: VacacionAprobadaEquipo) => void;
}) => {
    return (
        <div className={`${GLASS} rounded-2xl overflow-hidden`}>
            <div className="grid grid-cols-7 border-b border-white/10">
                {DIAS_SEMANA.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-white/50 py-2">{d}</div>
                ))}
            </div>
            
            <div className="grid grid-cols-7">
                {semanas.flatMap((semana, semanaIdx) =>
                    semana.map((dia, diaIdx) => {
                        const iso = fechaISO(dia);
                        const delMes = dia.getUTCMonth() === mes;
                        const esHoy = iso === hoy;
                        const esPasado = iso < hoy;
                        const items = vacacionesPorDia.get(iso) ?? [];

                        // Si algún empleado de vacaciones ese día es crítico (vencido o por
                        // vencer), el recuadro se resalta para que salte a la vista de inmediato.
                        const peorCriticoDelDia = items.reduce<'vencido' | 'critico' | null>((peor, v) => {
                            const estadoEmpleado = estadoCriticoPorEmpleadoId.get(v.empleadoId) ?? null;
                            if (estadoEmpleado === 'vencido') return 'vencido';
                            if (estadoEmpleado === 'critico' && peor !== 'vencido') return 'critico';
                            return peor;
                        }, null);

                        return (
                            <div
                                key={`${semanaIdx}-${diaIdx}`}
                                className={`min-h-[5.5rem] p-1.5 border-b border-r border-white/5 text-left align-top ${
                                    peorCriticoDelDia === 'vencido'
                                        ? 'bg-red-500/20 ring-2 ring-inset ring-red-500/70'
                                        : peorCriticoDelDia === 'critico'
                                            ? 'bg-orange-500/20 ring-2 ring-inset ring-orange-500/70'
                                            : items.length > 0
                                                ? 'bg-emerald-500/10'
                                                : ''
                                } ${esPasado ? 'opacity-50' : ''} ${!delMes ? 'opacity-30' : ''}`}
                            >
                                <span className={`text-xs inline-flex items-center justify-center w-5 h-5 rounded-full ${esHoy ? 'bg-[#4a8b2c] text-white font-semibold' : 'text-white/70'}`}>
                                    {dia.getUTCDate()}
                                </span>
                                <div className="mt-1 space-y-0.5">
                                    {items.slice(0, 3).map((v) => {
                                        const estadoP = estadoCriticoPorEmpleadoId.get(v.empleadoId);
                                        return (
                                            <button
                                                key={v.solicitudId}
                                                type="button"
                                                title="Ver / revocar esta solicitud"
                                                onClick={() => onSeleccionarVacacion(v)}
                                                className={`w-full text-left text-[10px] rounded px-1 py-0.5 truncate cursor-pointer hover:brightness-110 ${
                                                    estadoP === 'vencido'
                                                        ? 'bg-red-500/40 text-white font-medium'
                                                        : estadoP === 'critico'
                                                            ? 'bg-orange-500/40 text-white font-medium'
                                                            : 'bg-emerald-500/25 text-emerald-100'
                                                }`}
                                            >
                                                {nombrePorEmpleadoId.get(v.empleadoId) ?? '—'}
                                            </button>
                                        );
                                    })}
                                    {items.length > 3 && (
                                        <div className="text-[10px] text-white/50">+{items.length - 3} más</div>
                                    )}
                                </div>
                            </div>
                        );
                    }),
                )}
            </div>
        </div>
    );
};
