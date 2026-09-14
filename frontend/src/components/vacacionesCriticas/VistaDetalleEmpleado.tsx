

import { ChevronLeft, RefreshCw, AlertCircle, Building2, Users, UserCheck, Mail } from 'lucide-react';
import { GLASS } from '../../utils/estilos';
import { formatearFecha, iniciales, ESTADO_SALDO_ESTILOS } from './utils';
import type { DetalleEmpleadoAdmin } from '../../api/admin';

type Filtro = 'vencido' | 'critico';

export const VistaDetalleEmpleado = ({ detalle, cargando, error, filtro, onVolver }: {
    detalle: DetalleEmpleadoAdmin | null;
    cargando: boolean;
    error: string | null;
    filtro: Filtro;
    onVolver: () => void;
}) => {
    const esVencidoActivo = filtro === 'vencido';
    const etiquetaDias = esVencidoActivo ? 'vencidos' : 'por vencer';
    const saldosFiltrados = detalle?.saldos.filter((s) => s.estado === filtro) ?? [];

    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={onVolver}
                className={`${GLASS} flex items-center gap-1.5 text-sm text-white/80 hover:bg-white/20 px-3 py-1.5 rounded-lg cursor-pointer`}
            >
                <ChevronLeft size={16} />
                Volver
            </button>

            {cargando && (
                <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-6 h-6 text-white/60 animate-spin" />
                </div>
            )}

            {!cargando && error && (
                <div className={`${GLASS} p-4 rounded-xl text-red-200 flex items-center gap-2`}>
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {!cargando && !error && detalle && (
                <>
                    <div className={`${GLASS} rounded-2xl p-6`}>
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center font-semibold bg-white/15 text-white text-lg">
                                {iniciales(detalle.nombre)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-bold text-white leading-snug">{detalle.nombre}</p>
                                <p className="text-sm text-white/60">{detalle.puesto || 'Sin puesto'} · #{detalle.numeroEmpleado}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-sm">
                            <div className="flex items-center gap-2">
                                <Building2 size={14} className="text-white/40 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[11px] text-white/40 uppercase tracking-wide">Departamento</p>
                                    <p className="text-white/90 truncate">{detalle.departamento || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={14} className="text-white/40 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[11px] text-white/40 uppercase tracking-wide">Sociedad</p>
                                    <p className="text-white/90 truncate">{detalle.sociedad || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <UserCheck size={14} className="text-white/40 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[11px] text-white/40 uppercase tracking-wide">Jefe directo</p>
                                    <p className="text-white/90 truncate">{detalle.jefeDirecto?.nombre || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-white/40 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[11px] text-white/40 uppercase tracking-wide">Correo personal</p>
                                    <p className="text-white/90 truncate">{detalle.correoPersonal || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={`${GLASS} rounded-2xl overflow-hidden`}>
                        <div className="px-5 py-3 border-b border-white/10">
                            <h3 className="text-sm font-semibold text-white">{esVencidoActivo ? 'Periodos vencidos' : 'Periodos por vencer'}</h3>
                        </div>
                        <div className="divide-y divide-white/10">
                            {saldosFiltrados.length === 0 && (
                                <p className="px-5 py-6 text-sm text-white/50 text-center">
                                    Este empleado no tiene periodos {esVencidoActivo ? 'vencidos' : 'por vencer'}.
                                </p>
                            )}
                            {saldosFiltrados.map((saldo) => {
                                const estilos = ESTADO_SALDO_ESTILOS[saldo.estado];
                                return (
                                    <div key={saldo.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                                        <div>
                                            <p className="flex items-baseline gap-1.5 whitespace-nowrap text-sm">
                                                <span className="text-white/70">{esVencidoActivo ? 'Venció el día:' : 'Vence el día:'}</span>
                                                <span className="text-white/90 font-medium">{formatearFecha(saldo.fechaVencimiento)}</span>
                                            </p>
                                            <div className="mt-1.5 space-y-1">
                                                <p className="text-sm text-white/70">Días otorgados: <span className="font-semibold text-white">{saldo.diasPorLey}</span></p>
                                                <p className="text-sm text-white/70">Días disfrutados: <span className="font-semibold text-white">{saldo.diasDisfrutados}</span></p>
                                                <p className="text-sm text-white/70">Días {etiquetaDias}: <span className={`font-semibold ${estilos.texto}`}>{saldo.diasPendientes}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};