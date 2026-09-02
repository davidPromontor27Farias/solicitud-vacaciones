import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { obtenerNotificacionesJefe, type NotificacionSolicitud } from '../api/jefe';
import { formatearDiasComoRangos } from '../utils/fechas';

const CLAVE_VISTAS = 'jefe_notificaciones_vistas';
const INTERVALO_MS = 60_000;

function leerVistas(): Set<string> {
    try {
        const crudo = localStorage.getItem(CLAVE_VISTAS);
        return new Set(crudo ? (JSON.parse(crudo) as string[]) : []);
    } catch {
        return new Set();
    }
}

function guardarVistas(ids: Set<string>) {
    localStorage.setItem(CLAVE_VISTAS, JSON.stringify([...ids]));
}

export function NotificacionesJefe() {
    const [notificaciones, setNotificaciones] = useState<NotificacionSolicitud[]>([]);
    const [vistas, setVistas] = useState<Set<string>>(() => leerVistas());
    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    function cargar() {
        obtenerNotificacionesJefe()
            .then(setNotificaciones)
            .catch(() => {});
    }

    useEffect(() => {
        cargar();
        const intervalo = setInterval(cargar, INTERVALO_MS);
        return () => clearInterval(intervalo);
    }, []);

    useEffect(() => {
        function alClicarFuera(e: MouseEvent) {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                setAbierto(false);
            }
        }
        document.addEventListener('mousedown', alClicarFuera);
        return () => document.removeEventListener('mousedown', alClicarFuera);
    }, []);

    function alAbrir() {
        setAbierto((v) => !v);
        setVistas((prev) => {
            const siguiente = new Set(prev);
            notificaciones.forEach((n) => siguiente.add(n.solicitudId));
            guardarVistas(siguiente);
            return siguiente;
        });
    }

    function irARevisar(token: string) {
        setAbierto(false);
        navigate(`/revisar/${token}`);
    }

    const hayNuevas = notificaciones.some((n) => !vistas.has(n.solicitudId));

    return (
        <div className="relative" ref={contenedorRef}>
            <button
                type="button"
                onClick={alAbrir}
                title="Solicitudes pendientes"
                className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer transition-colors"
            >
                <Bell size={17} />
                {notificaciones.length > 0 && (
                    <span
                        className={`absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${
                            hayNuevas ? 'bg-red-500' : 'bg-white/30'
                        }`}
                    >
                        {notificaciones.length}
                    </span>
                )}
            </button>

            {abierto && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Solicitudes pendientes</h3>
                    </div>
                    {notificaciones.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-gray-400 text-center">Sin solicitudes pendientes.</p>
                    ) : (
                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                            {notificaciones.map((n) => (
                                <button
                                    key={n.solicitudId}
                                    type="button"
                                    onClick={() => irARevisar(n.enlaceToken)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-2"
                                >
                                    {!vistas.has(n.solicitudId) && (
                                        <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{n.empleadoNombre}</p>
                                        <p className="text-xs text-gray-500">{formatearDiasComoRangos(n.dias)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
