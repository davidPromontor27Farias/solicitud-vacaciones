import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { aprobarPorEnlace, declinarPorEnlace, obtenerDetalleRevision, rechazarPorEnlace, type DetalleRevision } from '../api/revision';
import { ApiError } from '../api/client';
import { dividirNombres } from '../utils/texto';

export const useRevisarSolicitudPage = () => {
    const { token } = useParams<{ token: string }>();
    const [detalle, setDetalle] = useState<DetalleRevision | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    const [mensaje, setMensaje] = useState<string | null>(null);
    const [mesActual, setMesActual] = useState<Date | null>(null);
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [mostrandoRechazo, setMostrandoRechazo] = useState(false);
    const [mostrandoAprobar, setMostrandoAprobar] = useState(false);
    const [motivoDeclinar, setMotivoDeclinar] = useState('');
    const [mostrandoDeclinar, setMostrandoDeclinar] = useState(false);
    const [backupSeleccionado, setBackupSeleccionado] = useState('');

    const cargar = async () => {
        if (!token) return;
        setCargando(true);
        setError(null);
        try {
            const resultado = await obtenerDetalleRevision(token);
            setDetalle(resultado);
            const primerDia = new Date(`${resultado.dias[0]}T00:00:00.000Z`);
            setMesActual(new Date(Date.UTC(primerDia.getUTCFullYear(), primerDia.getUTCMonth(), 1)));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const manejarAprobar = async () => {
        if (!token) return;
        const opcionesBackup = detalle ? dividirNombres(detalle.backupNombre ?? '') : [];
        if (opcionesBackup.length > 1 && !backupSeleccionado) {
            setError('Selecciona quién cubrirá al empleado');
            return;
        }
        setEnviando(true);
        setError(null);
        try {
            await aprobarPorEnlace(token, opcionesBackup.length > 1 ? backupSeleccionado : undefined);
            setMensaje('Solicitud aprobada correctamente.');
            await cargar();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    };

    const manejarRechazar = async () => {
        if (!token) return;
        if (!motivoRechazo.trim()) {
            setError('Indica el motivo del rechazo');
            return;
        }
        setEnviando(true);
        setError(null);
        try {
            await rechazarPorEnlace(token, motivoRechazo.trim());
            setMensaje('Solicitud rechazada.');
            await cargar();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    };

    const manejarDeclinar = async () => {
        if (!token) return;
        if (!motivoDeclinar.trim()) {
            setError('Indica el motivo de la declinación');
            return;
        }
        setEnviando(true);
        setError(null);
        try {
            await declinarPorEnlace(token, motivoDeclinar.trim());
            setMensaje('Solicitud declinada.');
            await cargar();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    };

    return {
        detalle, cargando, error, setError, enviando, mensaje,
        mesActual, setMesActual,
        motivoRechazo, setMotivoRechazo, mostrandoRechazo, setMostrandoRechazo,
        mostrandoAprobar, setMostrandoAprobar,
        motivoDeclinar, setMotivoDeclinar, mostrandoDeclinar, setMostrandoDeclinar,
        backupSeleccionado, setBackupSeleccionado,
        manejarAprobar, manejarRechazar, manejarDeclinar,
    };
};