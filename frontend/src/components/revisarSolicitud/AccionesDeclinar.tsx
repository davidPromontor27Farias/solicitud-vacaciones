export const AccionesDeclinar = ({
    mostrandoDeclinar, setMostrandoDeclinar,
    motivoDeclinar, setMotivoDeclinar,
    enviando, setError,
    onDeclinar,
}: {
    mostrandoDeclinar: boolean;
    setMostrandoDeclinar: (v: boolean) => void;
    motivoDeclinar: string;
    setMotivoDeclinar: (v: string) => void;
    enviando: boolean;
    setError: (v: string | null) => void;
    onDeclinar: () => void;
}) => {
    if (!mostrandoDeclinar) {
        return (
            <div className="space-y-3 pt-2 border-t border-gray-100">
                <button
                    onClick={() => setMostrandoDeclinar(true)}
                    disabled={enviando}
                    className="w-full bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                    Declinar
                </button>
            </div>
        );
    }

    return (
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
                    onClick={onDeclinar}
                    disabled={enviando}
                    className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                    Confirmar declinación
                </button>
            </div>
        </div>
    );
};