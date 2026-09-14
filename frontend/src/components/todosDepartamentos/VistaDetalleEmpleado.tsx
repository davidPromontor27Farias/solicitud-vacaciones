

import { useMemo } from 'react';
import { ChevronLeft, Building2 } from 'lucide-react';
import { GLASS } from '../../utils/estilos';
import { ESTILOS_ESTADO, formatearFecha, iniciales } from './utils';
import type { EmpleadoEquipo } from '../../api/jefe';

export const VistaDetalleEmpleado = ({ empleado, onVolver }: { empleado: EmpleadoEquipo; onVolver: () => void }) => {
    const saldosOrdenados = useMemo(
        () => [...empleado.saldos].sort((a, b) => a.fechaLimiteDisfrute.localeCompare(b.fechaLimiteDisfrute)),
        [empleado.saldos],
    );
    return (
        <div className="space-y-4">
            <button type="button" onClick={onVolver} className={`${GLASS} flex items-center gap-1.5 text-sm text-white/80 hover:bg-white/20 px-3 py-1.5 rounded-lg cursor-pointer`}>
                <ChevronLeft size={16} />
                Volver
            </button>
            <div className={`${GLASS} rounded-2xl p-6`}>
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center font-semibold bg-white/15 text-white text-lg">
                        {iniciales(empleado.nombre)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-lg font-bold text-white leading-snug">{empleado.nombre}</p>
                        <p className="text-sm text-white/60">{empleado.puesto || 'Sin puesto'} · #{empleado.numeroEmpleado}</p>
                        <p className="text-sm text-white/60 flex items-center gap-1.5 mt-0.5">
                            <Building2 size={13} className="text-white/40" />
                            {empleado.departamento || 'Sin departamento'}
                        </p>
                    </div>
                </div>
            </div>
            <div className={`${GLASS} rounded-2xl overflow-hidden`}>
                <div className="px-5 py-3 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white">Periodos de vacaciones ({saldosOrdenados.length})</h3>
                </div>
                <div className="divide-y divide-white/10">
                    {saldosOrdenados.map((saldo) => {
                        const estilo = ESTILOS_ESTADO[saldo.estado];
                        return (
                            <div key={saldo.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                                <div>
                                    <p className="flex items-baseline gap-1.5 whitespace-nowrap text-sm">
                                        <span className={`w-1.5 h-1.5 rounded-full ${estilo.punto}`} />
                                        <span className="text-white/70">{estilo.etiqueta} · Límite:</span>
                                        <span className="text-white/90 font-medium">{formatearFecha(saldo.fechaLimiteDisfrute)}</span>
                                    </p>
                                    <div className="mt-1.5 space-y-1">
                                        <p className="text-sm text-white/70">Días otorgados: <span className="font-semibold text-white">{saldo.diasPorLey}</span></p>
                                        <p className="text-sm text-white/70">Días disfrutados: <span className="font-semibold text-white">{saldo.diasDisfrutados}</span></p>
                                        <p className="text-sm text-white/70">Días pendientes: <span className={`font-semibold ${estilo.texto}`}>{saldo.diasPendientes}</span></p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};