import { AlertCircle, CheckCircle, Clock, FileText, History, RefreshCw, Users, XCircle } from 'lucide-react';
import { formatearDiasComoRangos } from '../../utils/fechas';
import { dividirNombres } from '../../utils/texto';
import type { SolicitudResumen } from '../../api/solicitudes';

const ESTATUS_ESTILOS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    pendiente: {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-700',
        icon: <Clock className="w-4 h-4" />
    },
    aprobada: {
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-700',
        icon: <CheckCircle className="w-4 h-4" />
    },
    rechazada: {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-700',
        icon: <XCircle className="w-4 h-4" />
    },
    revocada: {
        bg: 'bg-gray-50 border-gray-200',
        text: 'text-gray-700',
        icon: <RefreshCw className="w-4 h-4" />
    },
};

export const MisSolicitudes = ({ solicitudes, cargando, error }: { solicitudes: SolicitudResumen[]; cargando: boolean; error: string | null }) => {
    return (
        <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#4a8b2c]/10 rounded-lg">
                    <History className="w-5 h-5 text-[#4a8b2c]" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Mis Solicitudes</h2>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {solicitudes.length} solicitudes
                </span>
            </div>

            {cargando ? (
                <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
            ) : error ? (
                <div className="bg-red-50 p-4 rounded-xl text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            ) : solicitudes.length === 0 ? (
                <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Todavía no tienes solicitudes.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {solicitudes.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                        <div>
                        <p className="text-sm text-gray-900 font-medium">{formatearDiasComoRangos(s.dias)}</p>
                        {s.estatus !== 'revocada' && s.diasRevocados.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                <span className="text-red-600 font-medium">{s.diasRevocados.length} día{s.diasRevocados.length !== 1 ? 's' : ''} revocado{s.diasRevocados.length !== 1 ? 's' : ''}</span>
                                {' '}por tu jefe: {formatearDiasComoRangos(s.diasRevocados)}
                            </p>
                        )}
                        {s.backupNombre && (
                            <div className="text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Backup:
                            </span>
                            {dividirNombres(s.backupNombre).length > 1 ? (
                                <ul className="list-disc list-inside ml-4">
                                {dividirNombres(s.backupNombre).map((nombre, idx) => (
                                    <li key={idx}>{nombre}</li>
                                ))}
                                </ul>
                            ) : (
                                <span className="ml-4">{s.backupNombre}</span>
                            )}
                            </div>
                        )}
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${ESTATUS_ESTILOS[s.estatus].bg}`}>
                        {ESTATUS_ESTILOS[s.estatus].icon}
                        <span className={`text-xs font-medium ${ESTATUS_ESTILOS[s.estatus].text}`}>
                            {s.estatus}
                        </span>
                        </div>
                    </div>
                    ))}
                </div>
            )}
        </section>
    );
};
