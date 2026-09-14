import { dividirNombres } from '../../utils/texto';

export const SelectorBackup = ({
    backupNombre, estatus, esJefeDirecto, backupSeleccionado, onChangeBackup,
}: {
    backupNombre: string;
    estatus: string;
    esJefeDirecto: boolean;
    backupSeleccionado: string;
    onChangeBackup: (nombre: string) => void;
}) => {
    const opcionesBackup = dividirNombres(backupNombre);
    const puedeElegir = estatus === 'pendiente' && esJefeDirecto;

    if (opcionesBackup.length > 1 && puedeElegir) {
        return (
            <div className="mt-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Backup: ¿quién cubrirá al empleado?
                </label>
                <select
                    value={backupSeleccionado}
                    onChange={(e) => onChangeBackup(e.target.value)}
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
    return <p className="text-xs text-gray-500 mt-1">Backup: {backupNombre}</p>;
};
