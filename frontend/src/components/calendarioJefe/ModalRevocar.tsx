import { useMemo, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { revocarVacacionEquipo, type VacacionAprobadaEquipo } from '../../api/jefe';
import { ApiError } from '../../api/client';
import { formatearFecha } from '../../utils/fechas';
import { GLASS } from '../../utils/estilos';
import { hoyISO } from './utils';

export const ModalRevocar = ({
    vacacion,
    onCerrar,
    onRevocado,
}: {
    vacacion: VacacionAprobadaEquipo;
    onCerrar: () => void;
    onRevocado: () => void;
}) => {
    const diasOrdenados = useMemo(() => [...vacacion.dias].sort(), [vacacion.dias]);
    const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set(diasOrdenados));
    const [motivo, setMotivo] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const alternar = (dia: string) => {
        setSeleccionados((prev) => {
            const siguiente = new Set(prev);
            if (siguiente.has(dia)) siguiente.delete(dia);
            else siguiente.add(dia);
            return siguiente;
        });
    };

    const confirmar = async () => {
        if (seleccionados.size === 0) {
            setError('Selecciona al menos un día');
            return;
        }
        if (!motivo.trim()) {
            setError('Indica el motivo de la revocación');
            return;
        }
        setEnviando(true);
        setError(null);
        try {
            await revocarVacacionEquipo(vacacion.solicitudId, motivo.trim(), [...seleccionados].sort());
            onRevocado();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCerrar}>
            <div
                className="bg-gray-600 border border-white/20 shadow-2xl rounded-2xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        Revocar vacaciones
                    </h2>
                    <button type="button" onClick={onCerrar} className="text-white/50 hover:text-white cursor-pointer">
                        <X size={18} />
                    </button>
                </div>
                <p className="text-sm text-white/60 mb-4">{vacacion.empleadoNombre}</p>

                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/50 uppercase tracking-wide">
                        Días aprobados ({diasOrdenados.length})
                    </p>
                    <button
                        type="button"
                        onClick={() => setSeleccionados(seleccionados.size === diasOrdenados.length ? new Set() : new Set(diasOrdenados))}
                        className="text-xs text-white/70 hover:text-white cursor-pointer underline"
                    >
                        {seleccionados.size === diasOrdenados.length ? 'Ninguno' : 'Todos'}
                    </button>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/10 max-h-52 overflow-y-auto mb-4">
                    {diasOrdenados.map((dia) => (
                        <label
                            key={dia}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-white/90 cursor-pointer hover:bg-white/10"
                        >
                            <input
                                type="checkbox"
                                checked={seleccionados.has(dia)}
                                onChange={() => alternar(dia)}
                                className="accent-[#4a8b2c] w-4 h-4 cursor-pointer"
                            />
                            {formatearFecha(dia)}
                            {dia < hoyISO() && <span className="text-[10px] text-white/40">ya pasó</span>}
                        </label>
                    ))}
                </div>

                <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={2}
                    placeholder="Motivo de la revocación"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 mb-3"
                />

                {error && <p className="text-sm text-red-300 mb-3">{error}</p>}

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCerrar}
                        disabled={enviando}
                        className={`${GLASS} flex-1 py-2 rounded-xl text-sm text-white/80 hover:bg-white/20 cursor-pointer disabled:opacity-50`}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={confirmar}
                        disabled={enviando}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 text-sm font-medium disabled:opacity-50 cursor-pointer"
                    >
                        {enviando && <RefreshCw size={14} className="animate-spin" />}
                        Revocar {seleccionados.size} día{seleccionados.size !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};