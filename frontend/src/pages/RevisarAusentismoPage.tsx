import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    AlertCircle, CheckCircle, XCircle, Clock3, Quote, Home, CalendarOff, CalendarCheck,
    HeartPulse, LogOut, LogIn, RefreshCw,
} from 'lucide-react';
import {
    obtenerDetalleRevisionAusentismo,
    aprobarAusentismoPorEnlace,
    rechazarAusentismoPorEnlace,
    type DetalleRevisionAusentismo,
} from '../api/revisionAusentismo';
import { MOTIVOS_AUSENTISMO } from '../api/ausentismos';
import { formatearDiasComoRangos } from '../utils/fechas';
import { ApiError } from '../api/client';

const ICONOS_MOTIVO: Record<string, typeof Home> = {
    permiso_sin_goce: CalendarOff,
    permiso_con_goce: CalendarCheck,
    home_office: Home,
    tiempo_por_tiempo: Clock3,
    permiso_interno_salud: HeartPulse,
    permiso_salida: LogOut,
    permiso_entrada: LogIn,
};

const ESTATUS_ESTILOS: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
    pendiente: {
        bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
        icon: <Clock3 className="w-4 h-4" />, label: 'Pendiente',
    },
    aprobado: {
        bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',
        icon: <CheckCircle className="w-4 h-4" />, label: 'Aprobado',
    },
    rechazado: {
        bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200',
        icon: <XCircle className="w-4 h-4" />, label: 'Rechazado',
    },
};

export function RevisarAusentismoPage() {
    const { token } = useParams<{ token: string }>();
    const [detalle, setDetalle] = useState<DetalleRevisionAusentismo | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mensaje, setMensaje] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    const [mostrandoAprobar, setMostrandoAprobar] = useState(false);
    const [mostrandoRechazo, setMostrandoRechazo] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState('');

    const cargar = async () => {
        if (!token) return;
        setCargando(true);
        setError(null);
        try {
            const resultado = await obtenerDetalleRevisionAusentismo(token);
            setDetalle(resultado);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const aprobar = async () => {
        if (!token) return;
        setEnviando(true);
        setError(null);
        try {
            await aprobarAusentismoPorEnlace(token);
            setMensaje('Ausentismo aprobado correctamente.');
            setMostrandoAprobar(false);
            await cargar();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    };

    const rechazar = async () => {
        if (!token) return;
        if (!motivoRechazo.trim()) {
            setError('Indica el motivo del rechazo');
            return;
        }
        setEnviando(true);
        setError(null);
        try {
            await rechazarAusentismoPorEnlace(token, motivoRechazo.trim());
            setMensaje('Ausentismo rechazado.');
            setMostrandoRechazo(false);
            await cargar();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    };

    const IconoMotivo = detalle ? ICONOS_MOTIVO[detalle.motivo] ?? Clock3 : Clock3;
    const etiquetaMotivo = detalle
        ? MOTIVOS_AUSENTISMO.find((m) => m.value === detalle.motivo)?.label ?? detalle.motivo
        : '';
    const estiloEstatus = detalle ? ESTATUS_ESTILOS[detalle.estatus] ?? ESTATUS_ESTILOS.pendiente : ESTATUS_ESTILOS.pendiente;

    return (
        <div className="min-h-screen relative bg-gray-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('/walppaper.webp')` }}
            />
            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
                    {/* Encabezado */}
                    <div className="bg-gradient-to-r from-[#4a8b2c] to-[#ee7624] px-6 py-5">
                        <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Solicitud de ausentismo</p>
                        <h1 className="text-white text-lg font-bold mt-0.5 truncate">{detalle?.empleadoNombre ?? 'Cargando…'}</h1>
                    </div>

                    <div className="p-6 space-y-4">
                        {cargando && (
                            <div className="flex items-center justify-center py-6 gap-2 text-gray-500 text-sm">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Cargando…
                            </div>
                        )}

                        {error && (
                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 text-sm text-rose-700">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {mensaje && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2 text-sm text-emerald-700">
                                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{mensaje}</span>
                            </div>
                        )}

                        {detalle && (
                            <>
                                {/* Badge de estatus */}
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${estiloEstatus.bg} ${estiloEstatus.text} ${estiloEstatus.border}`}>
                                    {estiloEstatus.icon}
                                    {estiloEstatus.label}
                                </div>

                                {/* Detalle estructurado */}
                                <div className="space-y-2.5">
                                    <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                                        <div className="p-2 bg-[#4a8b2c]/10 rounded-lg shrink-0">
                                            <IconoMotivo className="w-4 h-4 text-[#4a8b2c]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500">Motivo</p>
                                            <p className="text-sm font-semibold text-gray-900">{etiquetaMotivo}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                                            <Clock3 className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-500">
                                                Día{detalle.dias.length !== 1 ? 's' : ''} solicitado{detalle.dias.length !== 1 ? 's' : ''}
                                            </p>
                                            <p className="text-sm font-semibold text-gray-900">{formatearDiasComoRangos(detalle.dias)}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                                            <Quote className="w-3.5 h-3.5" />
                                            Comentario del empleado
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed">{detalle.comentario}</p>
                                    </div>
                                </div>

                                {/* Acciones (solo si sigue pendiente) */}
                                {detalle.estatus === 'pendiente' && (
                                    <div className="pt-2 space-y-2.5">
                                        {!mostrandoAprobar && !mostrandoRechazo && (
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setMostrandoAprobar(true)}
                                                    disabled={enviando}
                                                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#4a8b2c] hover:bg-[#3d7423] text-white rounded-xl py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <CheckCircle size={16} /> Aprobar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMostrandoRechazo(true)}
                                                    disabled={enviando}
                                                    className="flex-1 flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <XCircle size={16} /> Rechazar
                                                </button>
                                            </div>
                                        )}

                                        {mostrandoAprobar && (
                                            <div className="space-y-2.5 pt-1 border-t border-gray-100">
                                                <p className="text-xs text-gray-500 pt-2">¿Confirmas aprobar este ausentismo?</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setMostrandoAprobar(false)}
                                                        disabled={enviando}
                                                        className="flex-1 bg-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-300 cursor-pointer disabled:opacity-50"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={aprobar}
                                                        disabled={enviando}
                                                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#4a8b2c] hover:bg-[#3d7423] text-white rounded-xl py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50"
                                                    >
                                                        {enviando && <RefreshCw size={14} className="animate-spin" />}
                                                        Confirmar aprobación
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {mostrandoRechazo && (
                                            <div className="space-y-2.5 pt-1 border-t border-gray-100">
                                                <div className="pt-2">
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Motivo del rechazo</label>
                                                    <textarea
                                                        value={motivoRechazo}
                                                        onChange={(e) => setMotivoRechazo(e.target.value)}
                                                        rows={2}
                                                        autoFocus
                                                        placeholder="Explica brevemente por qué se rechaza"
                                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setMostrandoRechazo(false); setMotivoRechazo(''); setError(null); }}
                                                        disabled={enviando}
                                                        className="flex-1 bg-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-300 cursor-pointer disabled:opacity-50"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={rechazar}
                                                        disabled={enviando}
                                                        className="flex-1 flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50"
                                                    >
                                                        {enviando && <RefreshCw size={14} className="animate-spin" />}
                                                        Confirmar rechazo
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Ya resuelto */}
                                {detalle.estatus !== 'pendiente' && (
                                    <div className={`flex items-start gap-2 rounded-xl p-3 text-sm border ${estiloEstatus.bg} ${estiloEstatus.text} ${estiloEstatus.border}`}>
                                        {estiloEstatus.icon}
                                        <div>
                                            <p className="font-medium">
                                                Este ausentismo ya fue {detalle.estatus === 'aprobado' ? 'aprobado' : 'rechazado'}.
                                            </p>
                                            {detalle.estatus === 'rechazado' && detalle.motivoRechazo && (
                                                <p className="text-xs mt-1 opacity-90">Motivo: {detalle.motivoRechazo}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
