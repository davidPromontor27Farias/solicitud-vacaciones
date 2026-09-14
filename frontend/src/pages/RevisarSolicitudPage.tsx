import { diasFinDeMes } from '../utils/fechas';
import { CalendarioColisiones } from '../components/CalendarioColisiones';
import { PanelEquipoMes } from '../components/PanelEquipoMes';
import { useRevisarSolicitudPage } from '../hooks/useRevisarSolicitudPage';
import { SelectorBackup } from '../components/revisarSolicitud/SelectorBackup';
import { AccionesAprobacion } from '../components/revisarSolicitud/AccionesAprobacion';
import { AccionesDeclinar } from '../components/revisarSolicitud/AccionesDeclinar';

const ESTATUS_ESTILOS: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    aprobada: 'bg-green-100 text-green-800',
    rechazada: 'bg-red-100 text-red-800',
    revocada: 'bg-gray-200 text-gray-700',
};

export function RevisarSolicitudPage() {
    const {
        detalle, cargando, error, setError, enviando, mensaje,
        mesActual, setMesActual,
        motivoRechazo, setMotivoRechazo, mostrandoRechazo, setMostrandoRechazo,
        mostrandoAprobar, setMostrandoAprobar,
        motivoDeclinar, setMotivoDeclinar, mostrandoDeclinar, setMostrandoDeclinar,
        backupSeleccionado, setBackupSeleccionado,
        manejarAprobar, manejarRechazar, manejarDeclinar,
    } = useRevisarSolicitudPage();

    return (
        <div className="min-h-screen relative bg-gray-50 flex items-center justify-center p-4">

            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('/walppaper.jpg')`,
                }}
            />

            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 flex flex-col lg:flex-row gap-4 items-start">
                <div className="w-full max-w-md bg-white/50 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/20">
                    <h1 className="text-lg font-semibold text-gray-900 mb-4">Revisar solicitud de vacaciones</h1>

                    {cargando && <p className="text-sm text-gray-500">Cargando...</p>}
                    {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                    {mensaje && <p className="text-sm text-green-700 mb-3">{mensaje}</p>}

                    {detalle && mesActual && (() => {
                    const finDeMes = diasFinDeMes(detalle.dias);
                    return (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-900 font-medium">{detalle.empleadoNombre}</p>
                            <p className="text-xs text-gray-500">Días: {detalle.dias.join(', ')}</p>
                            <span className={`inline-block mt-1 text-xs font-medium px-2 py-1 rounded-full ${ESTATUS_ESTILOS[detalle.estatus]}`}>
                                {detalle.estatus}
                            </span>
                            {detalle.backupNombre && (
                                <SelectorBackup
                                    backupNombre={detalle.backupNombre}
                                    estatus={detalle.estatus}
                                    esJefeDirecto={detalle.esJefeDirecto}
                                    backupSeleccionado={backupSeleccionado}
                                    onChangeBackup={setBackupSeleccionado}
                                />
                            )}
                        </div>

                        <CalendarioColisiones
                            mesActual={mesActual}
                            onMesActualChange={setMesActual}
                            diasSolicitados={detalle.dias}
                            diasEnColision={new Set(Object.keys(detalle.colisiones))}
                            diasEquipoAprobados={detalle.diasEquipoAprobados}
                            diasEquipoPendientes={detalle.diasEquipoPendientes}
                        />

                        {Object.keys(detalle.colisiones).length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                                <p className="font-medium mb-1">Días que chocan con vacaciones ya aprobadas:</p>
                                <ul className="list-disc list-inside">
                                    {Object.entries(detalle.colisiones).map(([dia, nombres]) => (
                                        <li key={dia}>{dia}: {nombres.join(', ')}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {finDeMes.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-700">
                                <p className="font-medium">
                                    Esta solicitud incluye {finDeMes.length === 1 ? 'un día de fin de mes' : 'días de fin de mes'}: {finDeMes.join(', ')}.
                                </p>
                                <p className="text-xs mt-0.5">Podrías necesitar a este empleado trabajando por cierre de mes.</p>
                            </div>
                        )}

                        {detalle.estatus === 'pendiente' && detalle.esJefeDirecto && (
                            <AccionesAprobacion
                                mostrandoAprobar={mostrandoAprobar}
                                setMostrandoAprobar={setMostrandoAprobar}
                                mostrandoRechazo={mostrandoRechazo}
                                setMostrandoRechazo={setMostrandoRechazo}
                                motivoRechazo={motivoRechazo}
                                setMotivoRechazo={setMotivoRechazo}
                                enviando={enviando}
                                setError={setError}
                                onAprobar={manejarAprobar}
                                onRechazar={manejarRechazar}
                            />
                        )}

                        {detalle.estatus === 'aprobada' && detalle.esJefeMatricial && (
                            <AccionesDeclinar
                                mostrandoDeclinar={mostrandoDeclinar}
                                setMostrandoDeclinar={setMostrandoDeclinar}
                                motivoDeclinar={motivoDeclinar}
                                setMotivoDeclinar={setMotivoDeclinar}
                                enviando={enviando}
                                setError={setError}
                                onDeclinar={manejarDeclinar}
                            />
                        )}
                    </div>
                    );
                    })()}
                </div>

                {detalle && mesActual && (
                    <PanelEquipoMes
                        mesActual={mesActual}
                        diasEquipoAprobados={detalle.diasEquipoAprobados}
                        diasEquipoPendientes={detalle.diasEquipoPendientes}
                    />
                )}
            </div>
        </div>
    );
}