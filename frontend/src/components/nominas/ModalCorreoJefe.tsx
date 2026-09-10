import { AlertCircle, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { asignarCorreoJefe, crearJefe, type CorreoJefeItem } from "../../api/admin";
import { ApiError } from "../../api/client";
import { GLASS } from "./estilos";



export const ModalCorreoJefe = ({
    modo, 
    item,
    onClose,
    onGuardado
}: {
    modo: 'agregar' | 'editar';
    item?: CorreoJefeItem;
    onClose: () => void;
    onGuardado: () => void;
}) => {
    const [numeroEmpleado, setNumeroEmpleado] = useState(item?.numeroEmpleado ?? '');
    const [nombre, setNombre] = useState(item?.nombre ?? '');
    const [departamento, setDepartamento] = useState(item?.departamento ?? '');
    const [correo, setCorreo] = useState(item?.correoAutorizacion ?? '');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const camposCompletos = modo === 'agregar'
        ? Boolean(numeroEmpleado && nombre && departamento && correo)
        : Boolean(numeroEmpleado && correo);

    const guardar = async () => {
        if (!camposCompletos) return;
        setGuardando(true);
        setError(null);
        try {
            if (modo === 'agregar') {
                await crearJefe({ numeroEmpleado, nombre, departamento, correo });
            } else {
                await asignarCorreoJefe(numeroEmpleado, correo);
            }
            onGuardado();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado al guardar');
        } finally {
            setGuardando(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className={`${GLASS} bg-[#1f2430]/90 rounded-2xl p-6 w-full max-w-md space-y-4`}>
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">
                        {modo === 'agregar' ? 'Agregar jefe' : 'Editar correo de jefe'}
                    </h3>

                    <button type="button" onClick={onClose} className="text-white/60 hover:text-white cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {modo === 'agregar' ? (
                    <>
                        <div>
                            <label className="block text-white/60 text-xs mb-1">No. de empleado</label>
                            <input
                                type="text"
                                value={numeroEmpleado}
                                onChange={(e) => setNumeroEmpleado(e.target.value)}
                                placeholder="12345"
                                className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 placeholder:text-white/30"
                            />
                        </div>
                        <div>
                            <label className="block text-white/60 text-xs mb-1">Nombre</label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Nombre completo"
                                className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 placeholder:text-white/30"
                            />
                        </div>
                        <div>
                            <label className="block text-white/60 text-xs mb-1">Departamento</label>
                            <input
                                type="text"
                                value={departamento}
                                onChange={(e) => setDepartamento(e.target.value)}
                                placeholder="Departamento"
                                className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 placeholder:text-white/30"
                            />
                        </div>
                    </>
                ) : (
                    <div>
                        <p className="text-white text-sm font-medium">{item?.nombre}</p>
                        <p className="text-white/50 text-xs">#{item?.numeroEmpleado}</p>
                    </div>
                )}
                <div>
                    <label className="block text-white/60 text-xs mb-1">Correo de autorización</label>
                    <input
                        type="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        placeholder="correo@imperquimia.com.mx"
                        className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 placeholder:text-white/30"
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-200 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 cursor-pointer"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={guardar}
                        disabled={guardando || !camposCompletos}
                        className="flex items-center gap-2 bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {guardando && <RefreshCw className="w-4 h-4 animate-spin" />}
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};