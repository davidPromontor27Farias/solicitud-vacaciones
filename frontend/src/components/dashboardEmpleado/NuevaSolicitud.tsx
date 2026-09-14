import { AlertCircle, Calendar, CheckCircle, Plus, RefreshCw, XCircle } from 'lucide-react';
import { SelectorDias } from '../SelectorDias';
import { formatearDiasComoRangos } from '../../utils/fechas';
import type { PerfilEmpleado } from '../../api/empleados';

export const NuevaSolicitud = ({
    perfil, diasSeleccionados, onCambiarDias, finDeMesSeleccionados,
    errorForm, exitoForm, enviando, onCrear,
}: {
    perfil: PerfilEmpleado | null;
    diasSeleccionados: string[];
    onCambiarDias: (dias: string[]) => void;
    finDeMesSeleccionados: string[];
    errorForm: string | null;
    exitoForm: string | null;
    enviando: boolean;
    onCrear: () => void;
}) => {
    if (!perfil) return null;

    if (perfil.totalPendientes === 0) {
        return (
            <section className="bg-gray-50 p-8 rounded-2xl border border-gray-200 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No tienes días disponibles para solicitar vacaciones.</p>
            </section>
        );
    }

    return (
        <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-[#ee7624]/10 rounded-lg">
                <Plus className="w-5 h-5 text-[#ee7624]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Nueva Solicitud de Vacaciones</h2>
            </div>

            <div className="bg-blue-50 p-3 rounded-xl flex items-start gap-2 p-6">
              <AlertCircle className="w-4 h-4 text-green-700 mt-0.5 shrink-0" />
                <p className="text-xs text-green-700">
                  Para solicitar vacaciones, debes de solicitarlos con  dias de antelación previo a la fecha solicitada.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                <SelectorDias seleccionados={diasSeleccionados} onChange={onCambiarDias} />
                </div>
                <div className="lg:w-80 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">Días seleccionados</p>
                    <p className='text-lg font-medium text-gray-900 mt-1'>
                        {diasSeleccionados.length > 0 ? (
                            <span className='text-[#4a8b2c]'>
                                {formatearDiasComoRangos(diasSeleccionados)}
                                <span className='text-gray-400 font-normal text-sm ml-1'>
                                    ({diasSeleccionados.length} día{diasSeleccionados.length > 1 ? 's' : ''})
                                </span>
                            </span>
                        ) : (
                            <span className='text-gray-400 text-sm'>Ninguno</span>
                        )}
                    </p>
                </div>

                {
                  finDeMesSeleccionados.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0"/>
                      <p className="text-xs text-amber-700">
                        Estás solicitando {finDeMesSeleccionados.length === 1 ? 'un día de fin de mes' : 'días de fin de mes'} ({formatearDiasComoRangos(finDeMesSeleccionados)}). Tu jefe directo podria necesitarte trabajando esos días por cierre de mes.
                      </p>
                    </div>
                  )
                }

                {exitoForm && (
                    <div className="bg-green-50 p-3 rounded-xl flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{exitoForm}</span>
                    </div>
                )}

                {errorForm && (
                    <div className="bg-red-50 p-3 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{errorForm}</span>
                    </div>
                )}

                <button
                    type="button"
                    onClick={onCrear}
                    disabled={enviando}
                    className="w-full bg-gradient-to-br from-[#4a8b2c] to-[#ee7624] text-white rounded-xl px-6 py-3 text-sm font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
                >
                    {enviando ? (
                    <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Enviando...
                    </span>
                    ) : (
                    <span className="flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Solicitar Vacaciones
                    </span>
                    )}
                </button>
                </div>
            </div>
        </section>
    );
};