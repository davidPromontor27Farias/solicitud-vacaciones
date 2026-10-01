export const AccionesAprobacion = ({
    dias,
    diasAprobados,
    mostrandoRechazo, setMostrandoRechazo,
    motivoRechazo, setMotivoRechazo,
    enviando, setError,
    onAprobar, onRechazar,
}: {
    dias: string[];
    diasAprobados: string[];
    mostrandoRechazo: boolean;
    setMostrandoRechazo: (v: boolean) => void;
    motivoRechazo: string;
    setMotivoRechazo: (v: string) => void;
    enviando: boolean;
    setError: (v: string | null) => void;
    onAprobar: () => void;
    onRechazar: () => void;
}) => {
    if (!mostrandoRechazo) {
        const esParcial = diasAprobados.length < dias.length;
        return (
            <div className="space-y-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                    Toca los días en el calendario de arriba para quitar los que no quieras aprobar.
                </p>

                {diasAprobados.length === 0 && (
                    <p className="text-xs text-red-600">Selecciona al menos un día, o usa "Rechazar" si no quieres aprobar ninguno.</p>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={onAprobar}
                        disabled={enviando || diasAprobados.length === 0}
                        className="flex-1 bg-green-600 text-white rounded-md py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                        {esParcial ? `Aprobar ${diasAprobados.length} de ${dias.length} días` : 'Aprobar'}
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
