import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    aprobarSolicitud,
    obtenerCalendarioMiEquipo,
    obtenerSolicitudesEquipo,
    rechazarSolicitud,
    revocarSolicitud,
    type SolicitudEquipo,
} from '../api/solicitudes';
import { obtenerPerfil } from '../api/empleados';
import { ApiError } from '../api/client';
import { CalendarioColisiones } from '../components/CalendarioColisiones';
import { CalendarioEquipo } from '../components/CalendarioEquipo';
import { PanelEquipoMes } from '../components/PanelEquipoMes';
import { ArrowLeft } from 'lucide-react';
import { dividirNombres } from '../utils/texto';

const ESTATUS_ESTILOS: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    aprobada: 'bg-green-100 text-green-800',
    rechazada: 'bg-red-100 text-red-800',
    revocada: 'bg-gray-200 text-gray-700',
};

export function EquipoPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [esJefe, setEsJefe] = useState<boolean | null>(null);
    const [solicitudes, setSolicitudes] = useState<SolicitudEquipo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);
    const [mesActual, setMesActual] = useState<Date | null>(null);
    const [backupSeleccionado, setBackupSeleccionado] = useState('');

    const seleccionadaId = searchParams.get('solicitud');
    const seleccionada = solicitudes.find((s) => s.id === seleccionadaId) ?? null;
    const navigate = useNavigate();

    useEffect(() => {
        if (!seleccionada) return;
        const primerDia = new Date(`${seleccionada.dias[0]}T00:00:00.000Z`);
        setMesActual(new Date(Date.UTC(primerDia.getUTCFullYear(), primerDia.getUTCMonth(), 1)));
        setBackupSeleccionado('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seleccionada?.id]);

    async function cargar() {
        setCargando(true);
        setError(null);
        try {
            const perfil = await obtenerPerfil();
            setEsJefe(perfil.esJefe);
            const resultado = perfil.esJefe
                ? await obtenerSolicitudesEquipo()
                : await obtenerCalendarioMiEquipo();
            setSolicitudes(resultado);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargar();
    }, []);

    function seleccionar(id: string) {
        setSearchParams({ solicitud: id });
    }

    async function manejarAprobar(id: string) {
        const opcionesBackup = seleccionada ? dividirNombres(seleccionada.backupNombre ?? '') : [];
        if (opcionesBackup.length > 1 && !backupSeleccionado) {
            setError('Selecciona quién cubrirá al empleado');
            return;
        }
        setAccionEnCurso(id);
        setError(null);
        try {
            await aprobarSolicitud(id, opcionesBackup.length > 1 ? backupSeleccionado : undefined);
            await cargar();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setAccionEnCurso(null);
        }
    }

    async function manejarRechazar(id: string) {
        const motivo = window.prompt('Motivo del rechazo:');
        if (!motivo || !motivo.trim()) return;

        setAccionEnCurso(id);
        setError(null);
        try {
            await rechazarSolicitud(id, motivo.trim());
            await cargar();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setAccionEnCurso(null);
        }
    }

    async function manejarRevocar(id: string) {
        const motivo = window.prompt('Motivo de la revocación:');
        if (!motivo) return;

        setAccionEnCurso(id);
        setError(null);
        try {
            await revocarSolicitud(id, motivo);
            await cargar();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setAccionEnCurso(null);
        }
    }

    if (cargando && esJefe === null) {
        return <p className="text-sm text-gray-500">Cargando...</p>;
    }

    if (esJefe === false) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Vacaciones de mi equipo</h2>
                {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                <CalendarioEquipo solicitudes={solicitudes} />
            </div>
        );
    }

    const diasEnColision = new Set<string>();
    const colisionesPorDia = new Map<string, string[]>();
    const diasEquipoAprobados: Record<string, string[]> = {};
    const diasEquipoPendientes: Record<string, string[]> = {};
    if (seleccionada) {
        for (const otra of solicitudes) {
            if (otra.id === seleccionada.id) continue;
            if (otra.estatus !== 'aprobada' && otra.estatus !== 'pendiente') continue;

            const nombre = otra.empleadoNombre ?? 'Otro empleado';
            for (const dia of otra.dias) {
                if (otra.estatus === 'aprobada') {
                    diasEquipoAprobados[dia] = [...(diasEquipoAprobados[dia] ?? []), nombre];
                    if (seleccionada.dias.includes(dia)) {
                        diasEnColision.add(dia);
                        const lista = colisionesPorDia.get(dia) ?? [];
                        lista.push(nombre);
                        colisionesPorDia.set(dia, lista);
                    }
                } else {
                    diasEquipoPendientes[dia] = [...(diasEquipoPendientes[dia] ?? []), nombre];
                }
            }
        }
    }

    return (
        <div className="space-y-6">

        <button onClick={() => navigate(-1)}>
            <ArrowLeft className='text-white cursor-pointer '/>
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Solicitudes de mi equipo</h2>
                {cargando && <p className="text-sm text-gray-500">Cargando...</p>}
                {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                {!cargando && solicitudes.length === 0 && (
                    <p className="text-sm text-gray-500">No hay solicitudes de tu equipo en este rango de fechas.</p>
                )}
                <ul className="divide-y divide-gray-100">
                    {solicitudes.map((s) => (
                        <li key={s.id}>
                            <button
                                type="button"
                                onClick={() => seleccionar(s.id)}
                                className={`w-full text-left py-3 px-2 rounded-md flex items-center justify-between gap-4 ${seleccionadaId === s.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                            >
                                <div>
                                    <p className="text-sm text-gray-900">{s.empleadoNombre ?? s.empleadoId}</p>
                                    <p className="text-xs text-gray-500">{s.dias.join(', ')}</p>
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${ESTATUS_ESTILOS[s.estatus]}`}>
                                    {s.estatus}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalle</h2>
                {!seleccionada && (
                    <p className="text-sm text-gray-500">Selecciona una solicitud de la lista para ver su detalle.</p>
                )}
                {seleccionada && mesActual && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-900 font-medium">{seleccionada.empleadoNombre ?? seleccionada.empleadoId}</p>
                            <p className="text-xs text-gray-500">Días: {seleccionada.dias.join(', ')}</p>
                            <span className={`inline-block mt-1 text-xs font-medium px-2 py-1 rounded-full ${ESTATUS_ESTILOS[seleccionada.estatus]}`}>
                                {seleccionada.estatus}
                            </span>
                            {seleccionada.backupNombre && (() => {
                                const opcionesBackup = dividirNombres(seleccionada.backupNombre!);
                                if (seleccionada.estatus === 'pendiente' && opcionesBackup.length > 1) {
                                    return (
                                        <div className="mt-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Backup: ¿quién cubrirá al empleado?
                                            </label>
                                            <select
                                                value={backupSeleccionado}
                                                onChange={(e) => setBackupSeleccionado(e.target.value)}
                                                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                                            >
                                                <option value="">Selecciona una opción</option>
                                                {opcionesBackup.map((nombre) => (
                                                    <option key={nombre} value={nombre}>{nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                }
                                if (opcionesBackup.length > 1) {
                                    return (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Backup:
                                            <ul className="list-disc list-inside ml-4">
                                                {opcionesBackup.map((nombre, idx) => (
                                                    <li key={idx}>{nombre}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                }
                                return <p className="text-xs text-gray-500 mt-1">Backup: {seleccionada.backupNombre}</p>;
                            })()}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <CalendarioColisiones
                                mesActual={mesActual}
                                onMesActualChange={setMesActual}
                                diasSolicitados={seleccionada.dias}
                                diasEnColision={diasEnColision}
                                diasEquipoAprobados={diasEquipoAprobados}
                                diasEquipoPendientes={diasEquipoPendientes}
                            />
                            <PanelEquipoMes
                                mesActual={mesActual}
                                diasEquipoAprobados={diasEquipoAprobados}
                                diasEquipoPendientes={diasEquipoPendientes}
                            />
                        </div>

                        {diasEnColision.size > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                                <p className="font-medium mb-1">Este empleado tiene días que chocan con vacaciones ya aprobadas:</p>
                                <ul className="list-disc list-inside">
                                    {[...colisionesPorDia.entries()].map(([dia, nombres]) => (
                                        <li key={dia}>{dia}: {nombres.join(', ')}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            {seleccionada.estatus === 'pendiente' && (
                                <>
                                    <button
                                        onClick={() => manejarAprobar(seleccionada.id)}
                                        disabled={accionEnCurso === seleccionada.id}
                                        className="text-xs font-medium bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Aprobar
                                    </button>
                                    <button
                                        onClick={() => manejarRechazar(seleccionada.id)}
                                        disabled={accionEnCurso === seleccionada.id}
                                        className="text-xs font-medium bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Rechazar
                                    </button>
                                </>
                            )}
                            {seleccionada.estatus === 'aprobada' && (
                                <button
                                    onClick={() => manejarRevocar(seleccionada.id)}
                                    disabled={accionEnCurso === seleccionada.id}
                                    className="text-xs font-medium bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Revocar
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendario del equipo</h2>
            <CalendarioEquipo solicitudes={solicitudes.filter((s) => s.estatus === 'aprobada')} />
        </div>
        </div>
    );
}
