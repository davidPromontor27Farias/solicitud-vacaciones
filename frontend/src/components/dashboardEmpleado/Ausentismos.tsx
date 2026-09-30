import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { SelectorDias } from '../SelectorDias';
import { useAusentismos } from '../../hooks/useAusentismos';

const ESTATUS_ESTILOS: Record<string, { bg: string; text: string }> = {
    pendiente: { bg: 'bg-amber-50 border-amber-200/80', text: 'text-amber-700' },
    aprobado: { bg: 'bg-emerald-50 border-emerald-200/80', text: 'text-emerald-700' },
    rechazado: { bg: 'bg-rose-50 border-rose-200/80', text: 'text-rose-700' },
};

export const Ausentismos = () => {
    const {
        motivo, seleccionarMotivo,
        comentario, setComentario,
        diasSeleccionados, setDiasSeleccionados,
        enviando, errorForm, exitoForm,
        manejarCrear,
        ausentismos, cargandoLista, errorLista,
        MOTIVOS_AUSENTISMO,
    } = useAusentismos();

    return (
        <div className="space-y-6">
            <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Nuevo permiso de ausentismo</h2>

                <div className="space-y-2 mb-4">
                    {MOTIVOS_AUSENTISMO.map((m) => (
                        <label
                            key={m.value}
                            className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={motivo === m.value}
                                onChange={() => seleccionarMotivo(m.value)}
                                className="w-4 h-4 accent-[#4a8b2c] cursor-pointer"
                            />
                            <span className="text-sm text-gray-800">{m.label}</span>
                        </label>
                    ))}
                </div>

                {motivo && (
                    <div className="space-y-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Comentario (explica por qué necesitas el permiso)
                            </label>
                            <textarea
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                                rows={3}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a8b2c]/30"
                                placeholder="Escribe aquí el motivo..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Días</label>
                            <SelectorDias seleccionados={diasSeleccionados} onChange={setDiasSeleccionados} />
                        </div>
                    </div>
                )}

                {exitoForm && (
                    <div className="bg-green-50 p-3 rounded-xl flex items-center gap-2 text-green-700 text-sm mb-3">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>{exitoForm}</span>
                    </div>
                )}
                {errorForm && (
                    <div className="bg-red-50 p-3 rounded-xl flex items-center gap-2 text-red-700 text-sm mb-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorForm}</span>
                    </div>
                )}

                <button
                    type="button"
                    onClick={manejarCrear}
                    disabled={enviando || !motivo}
                    className="w-full bg-gradient-to-br from-[#4a8b2c] to-[#ee7624] text-white rounded-xl px-6 py-3 text-sm font-medium disabled:opacity-50"
                >
                    {enviando ? 'Enviando...' : 'Solicitar ausentismo'}
                </button>
            </section>

            <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Mis ausentismos</h2>

                {cargandoLista ? (
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                ) : errorLista ? (
                    <p className="text-sm text-red-600">{errorLista}</p>
                ) : ausentismos.length === 0 ? (
                    <p className="text-sm text-gray-500">Todavía no tienes ausentismos registrados.</p>
                ) : (
                    <div className="space-y-2">
                        {ausentismos.map((a) => {
                            const estilo = ESTATUS_ESTILOS[a.estatus];
                            const etiquetaMotivo = MOTIVOS_AUSENTISMO.find((m) => m.value === a.motivo)?.label ?? a.motivo;
                            return (
                                <div key={a.id} className="p-3 rounded-xl border border-gray-100">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-gray-900">{etiquetaMotivo}</p>
                                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${estilo.bg} ${estilo.text}`}>
                                            {a.estatus}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{a.dias.join(', ')}</p>
                                    <p className="text-xs text-gray-600 mt-1">{a.comentario}</p>
                                    {a.estatus === 'rechazado' && a.motivoRechazo && (
                                        <p className="text-xs text-rose-700 mt-1">Motivo del rechazo: {a.motivoRechazo}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};