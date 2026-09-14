export const AccionesAprobacion = ({
    mostrandoAprobar, setMostrandoAprobar,
    mostrandoRechazo, setMostrandoRechazo,
    motivoRechazo, setMotivoRechazo,
    enviando, setError,
    onAprobar, onRechazar,
}: {
    mostrandoAprobar: boolean;
    setMostrandoAprobar: (v: boolean) => void;
    mostrandoRechazo: boolean;
    setMostrandoRechazo: (v: boolean) => void;
    motivoRechazo: string;
    setMotivoRechazo: (v: string) => void;
    enviando: boolean;
    setError: (v: string | null) => void;
    onAprobar: () => void;
    onRechazar: () => void;
}) => {
    if (!mostrandoAprobar && !mostrandoRechazo) {
        return (
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
        );
    }

    if (mostrandoAprobar) {
        return (
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
                        onClick={onAprobar}
                        disabled={enviando}
                        className="flex-1 bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                        Confirmar aprobación
                    </button>
                </div>
            </div>
        );
    }

    return (
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
                    onClick={onRechazar}
                    disabled={enviando}
                    className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                    Confirmar rechazo
                </button>
            </div>
        </div>
    );
};