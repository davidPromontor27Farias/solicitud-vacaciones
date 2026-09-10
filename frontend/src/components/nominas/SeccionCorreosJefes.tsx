

import { Upload, RefreshCw, AlertCircle, CheckCircle2, Plus, Edit, Trash2 } from 'lucide-react';
import { useCorreosJefes } from '../../hooks/useCorreosJefes';
import { ModalCorreoJefe } from './ModalCorreoJefe';
import { GLASS } from './estilos';

export const SeccionCorreosJefes = () => {
    const {
        archivo, setArchivo, subiendo, subir, error, resultado,
        cargandoLista, errorLista, busqueda, setBusqueda,
        conCorreo, filasVisibles,
        modal, setModal, eliminando, eliminar, cargarLista,
    } = useCorreosJefes();

    return (
        <div className="space-y-6">
            <div className={`${GLASS} rounded-2xl p-6 space-y-4`}>
                <div>
                    <h3 className="text-white font-semibold">Actualizar correos de jefes directos</h3>
                    <p className="text-white/60 text-sm mt-1">
                        Sube un archivo .xlsx con las columnas "Número de empleado", "Nombre" y "correo".
                        Se actualizará el correo del jefe que coincida con ese número de empleado.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="file"
                        accept=".xlsx"
                        onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                        className="text-sm text-white/80 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/20 file:text-white file:cursor-pointer file:hover:bg-white/30 cursor-pointer"
                    />
                    <button
                        type="button"
                        onClick={subir}
                        disabled={!archivo || subiendo}
                        className="flex items-center gap-2 bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {subiendo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {subiendo ? 'Subiendo...' : 'Subir archivo'}
                    </button>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-200 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {resultado && (
                    <div className="space-y-2 border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            {resultado.actualizados} {resultado.actualizados === 1 ? 'jefe actualizado' : 'jefes actualizados'}
                        </div>
                        {resultado.noEncontrados.length > 0 && (
                            <div className="text-sm text-amber-300">
                                <p className="font-medium mb-1">{resultado.noEncontrados.length} no encontrados en la base de datos:</p>
                                <ul className="text-white/60 text-xs space-y-0.5 max-h-32 overflow-y-auto">
                                    {resultado.noEncontrados.map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={`${GLASS} rounded-2xl p-6 space-y-4`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-white font-semibold">Jefes con correo de autorizacion</h3>
                        <p className="text-white/60 text-sm mt-1">
                            {conCorreo.length} {conCorreo.length === 1 ? 'jefe registrado' : 'jefes registrados'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por nombre o número..."
                            className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 placeholder:text-white/30"
                        />
                        <button
                            type="button"
                            onClick={() => setModal({ modo: 'agregar' })}
                            className="flex items-center gap-2 bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar jefe
                        </button>
                    </div>
                </div>

                {cargandoLista && (
                    <div className="flex items-center justify-center py-10">
                        <RefreshCw className="w-6 h-6 text-white/60 animate-spin" />
                    </div>
                )}

                {!cargandoLista && errorLista && (
                    <div className="flex items-center gap-2 text-red-200 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorLista}</span>
                    </div>
                )}

                {!cargandoLista && !errorLista && filasVisibles.length === 0 && (
                    <p className="text-white/60 text-sm text-center py-6">
                        {conCorreo.length === 0 ? 'Todavía no hay jefes con correo asignado.' : 'Sin resultados para esa búsqueda.'}
                    </p>
                )}

                {!cargandoLista && !errorLista && filasVisibles.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wide">
                                    <th className="text-left px-5 py-3">No. empleado</th>
                                    <th className="text-left px-5 py-3">Nombre</th>
                                    <th className="text-left px-5 py-3">Departamento</th>
                                    <th className="text-left px-5 py-3">Correo</th>
                                    <th className="text-right px-5 py-3">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-white/10">
                                {filasVisibles.map((item) => (
                                    <tr key={item.empleadoId} className="text-white/90">
                                        <td className="px-5 py-3 text-white/70">#{item.numeroEmpleado}</td>
                                        <td className="px-5 py-3">{item.nombre}</td>
                                        <td className="px-5 py-3 text-white/70">{item.departamento ?? '—'}</td>
                                        <td className="px-5 py-3 text-white/70">{item.correoAutorizacion}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setModal({ modo: 'editar', item })}
                                                    title="Editar correo"
                                                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => eliminar(item)}
                                                    disabled={eliminando === item.numeroEmpleado}
                                                    title="Quitar correo"
                                                    className="p-1.5 rounded-lg text-white/60 hover:text-red-300 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
                                                >
                                                    {eliminando === item.numeroEmpleado ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {
                modal && (
                    <ModalCorreoJefe
                        modo={modal.modo}
                        item={modal.item}
                        onClose={() => setModal(null)}
                        onGuardado={() => {
                            setModal(null);
                            cargarLista();
                        }}
                    />
                )
            }
        </div>

        );

    };






