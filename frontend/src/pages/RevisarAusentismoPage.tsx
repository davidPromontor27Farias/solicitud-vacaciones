import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import {
    obtenerDetalleRevisionAusentismo,
    aprobarAusentismoPorEnlace,
    rechazarAusentismoPorEnlace,
    type DetalleRevisionAusentismo,
} from '../api/revisionAusentismo';
import { ApiError } from '../api/client';

export function RevisarAusentismoPage() {
    const { token } = useParams<{ token: string }>();
    const [detalle, setDetalle] = useState<DetalleRevisionAusentismo | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mensaje, setMensaje] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
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
            await cargar();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="min-h-screen relative bg-gray-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url('/walppaper.jpg')` }}
            />
            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 w-full max-w-md bg-white/50 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/20">
                <h1 className="text-lg font-semibold text-gray-900 mb-4">Revisar ausentismo</h1>

                {cargando && <p className="text-sm text-gray-500">Cargando...</p>}
                {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                {mensaje && <p className="text-sm text-green-700 mb-3">{mensaje}</p>}

                {detalle && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-900 font-medium">{detalle.empleadoNombre}</p>
                            <p className="text-xs text-gray-500 mt-1">Motivo: {detalle.motivo}</p>
                            <p className="text-xs text-gray-500">Días: {detalle.dias.join(', ')}</p>
                            <p className="text-xs text-gray-600 mt-2 bg-white/60 p-2 rounded-md">{detalle.comentario}</p>
                        </div>

                        {detalle.estatus === 'pendiente' ? (
                            !mostrandoRechazo ? (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={aprobar}
                                        disabled={enviando}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#4a8b2c] hover:bg-[#3d7423] text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
                                    >
                                        <CheckCircle size={16} /> Aprobar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMostrandoRechazo(true)}
                                        disabled={enviando}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
                                    >
                                        <XCircle size={16} /> Rechazar
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <textarea
                                        value={motivoRechazo}
                                        onChange={(e) => setMotivoRechazo(e.target.value)}
                                        rows={2}
                                        placeholder="Motivo del rechazo"
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMostrandoRechazo(false)}
                                            className="flex-1 bg-gray-200 text-gray-700 rounded-md py-2 text-sm font-medium"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={rechazar}
                                            disabled={enviando}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
                                        >
                                            Confirmar rechazo
                                        </button>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="bg-white/60 p-3 rounded-md flex items-center gap-2 text-sm text-gray-700">
                                <AlertCircle size={16} />
                                Este ausentismo ya fue {detalle.estatus}.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}