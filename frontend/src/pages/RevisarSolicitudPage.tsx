import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { aprobarPorEnlace, declinarPorEnlace, obtenerDetalleRevision, rechazarPorEnlace, type DetalleRevision } from '../api/revision';
import { ApiError } from '../api/client';
import { CalendarioColisiones } from '../components/CalendarioColisiones';
import { PanelEquipoMes } from '../components/PanelEquipoMes';

const ESTATUS_ESTILOS: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    aprobada: 'bg-green-100 text-green-800',
    rechazada: 'bg-red-100 text-red-800',
    revocada: 'bg-gray-200 text-gray-700',
};

export function RevisarSolicitudPage() {
    const { token } = useParams<{ token: string }>();
    const [detalle, setDetalle] = useState<DetalleRevision | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    const [mensaje, setMensaje] = useState<string | null>(null);
    const [mesActual, setMesActual] = useState<Date | null>(null);
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [mostrandoRechazo, setMostrandoRechazo] = useState(false);
    const [mostrandoAprobar, setMostrandoAprobar] = useState(false);
    const [motivoDeclinar, setMotivoDeclinar] = useState('');
    const [mostrandoDeclinar, setMostrandoDeclinar] = useState(false);

    async function cargar() {
        if (!token) return;
        setCargando(true);
        setError(null);
        try {
            const resultado = await obtenerDetalleRevision(token);
            setDetalle(resultado);
            const primerDia = new Date(`${resultado.dias[0]}T00:00:00.000Z`);
            setMesActual(new Date(Date.UTC(primerDia.getUTCFullYear(), primerDia.getUTCMonth(), 1)));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    async function manejarAprobar() {
        if (!token) return;
        setEnviando(true);
        setError(null);
        try {
            await aprobarPorEnlace(token);
            setMensaje('Solicitud aprobada correctamente.');
            await cargar();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    }

    async function manejarRechazar() {
        if (!token) return;
        if (!motivoRechazo.trim()) {
            setError('Indica el motivo del rechazo');
            return;
        }
        setEnviando(true);
        setError(null);
        try {
            await rechazarPorEnlace(token, motivoRechazo.trim());
            setMensaje('Solicitud rechazada.');
            await cargar();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    }

    async function manejarDeclinar() {
        if (!token) return;
        if (!motivoDeclinar.trim()) {
            setError('Indica el motivo de la declinación');
            return;
        }
        setEnviando(true);
        setError(null);
        try {
            await declinarPorEnlace(token, motivoDeclinar.trim());
            setMensaje('Solicitud declinada.');
            await cargar();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="min-h-screen relative bg-gray-50 flex items-center justify-center p-4">


            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('/walppaper.jpg')`,
                }}
            />

            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-start">
                <div className="w-full max-w-md bg-white/50 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/20">
                    <h1 className="text-lg font-semibold text-gray-900 mb-4">Revisar solicitud de vacaciones</h1>

                    {cargando && <p className="text-sm text-gray-500">Cargando...</p>}
                    {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                    {mensaje && <p className="text-sm text-green-700 mb-3">{mensaje}</p>}

                    {detalle && mesActual && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-900 font-medium">{detalle.empleadoNombre}</p>
                            <p className="text-xs text-gray-500">Días: {detalle.dias.join(', ')}</p>
                            <span className={`inline-block mt-1 text-xs font-medium px-2 py-1 rounded-full ${ESTATUS_ESTILOS[detalle.estatus]}`}>
                                {detalle.estatus}
                            </span>
                            {detalle.backupNombre && (
                                <p className="text-xs text-gray-500 mt-1">Backup: {detalle.backupNombre}</p>
                            )}
                        </div>

                        <CalendarioColisiones
                            mesActual={mesActual}
                            onMesActualChange={setMesActual}
                            diasSolicitados={detalle.dias}
                            diasEnColision={new Set(Object.keys(detalle.colisiones))}
                            diasEquipoAprobados={detalle.diasEquipoAprobados}
                            diasEquipoPendientes={detalle.diasEquipoPendientes}
                        />

                        {Object.keys(detalle.colisiones).length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                                <p className="font-medium mb-1">Días que chocan con vacaciones ya aprobadas:</p>
                                <ul className="list-disc list-inside">
                                    {Object.entries(detalle.colisiones).map(([dia, nombres]) => (
                                        <li key={dia}>{dia}: {nombres.join(', ')}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {detalle.estatus === 'pendiente' && detalle.esJefeDirecto && !mostrandoAprobar && !mostrandoRechazo && (
                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setMostrandoAprobar(true)}
                                        disabled={enviando}
                                        className="flex-1 bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Aprobar
                                    </button>
                                    <button
                                        onClick={() => setMostrandoRechazo(true)}
                                        disabled={enviando}
                                        className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        )}

                        {detalle.estatus === 'pendiente' && detalle.esJefeDirecto && mostrandoAprobar && (
                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setMostrandoAprobar(false); setError(null); }}
                                        disabled={enviando}
                                        className="flex-1 bg-gray-200 text-gray-700 rounded-md py-2 text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={manejarAprobar}
                                        disabled={enviando}
                                        className="flex-1 bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Confirmar aprobación
                                    </button>
                                </div>
                            </div>
                        )}

                        {detalle.estatus === 'pendiente' && detalle.esJefeDirecto && mostrandoRechazo && (
                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del rechazo</label>
                                    <textarea
                                        value={motivoRechazo}
                                        onChange={(e) => setMotivoRechazo(e.target.value)}
                                        rows={2}
                                        autoFocus
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setMostrandoRechazo(false); setMotivoRechazo(''); setError(null); }}
                                        disabled={enviando}
                                        className="flex-1 bg-gray-200 text-gray-700 rounded-md py-2 text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={manejarRechazar}
                                        disabled={enviando}
                                        className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Confirmar rechazo
                                    </button>
                                </div>
                            </div>
                        )}

                        {detalle.estatus === 'aprobada' && detalle.esJefeMatricial && !mostrandoDeclinar && (
                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <button
                                    onClick={() => setMostrandoDeclinar(true)}
                                    disabled={enviando}
                                    className="w-full bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                >
                                    Declinar
                                </button>
                            </div>
                        )}

                        {detalle.estatus === 'aprobada' && detalle.esJefeMatricial && mostrandoDeclinar && (
                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la declinación</label>
                                    <textarea
                                        value={motivoDeclinar}
                                        onChange={(e) => setMotivoDeclinar(e.target.value)}
                                        rows={2}
                                        autoFocus
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setMostrandoDeclinar(false); setMotivoDeclinar(''); setError(null); }}
                                        disabled={enviando}
                                        className="flex-1 bg-gray-200 text-gray-700 rounded-md py-2 text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={manejarDeclinar}
                                        disabled={enviando}
                                        className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Confirmar declinación
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    )}
                </div>

                {detalle && mesActual && (
                    <PanelEquipoMes
                        mesActual={mesActual}
                        diasEquipoAprobados={detalle.diasEquipoAprobados}
                        diasEquipoPendientes={detalle.diasEquipoPendientes}
                    />
                )}
            </div>
        </div>
    );
}
