import { useEffect, useState } from 'react';
import { crearAusentismo, obtenerMisAusentismos, MOTIVOS_AUSENTISMO, type AusentismoResumen, type MotivoAusentismo } from '../api/ausentismos';
import { ApiError } from '../api/client';

export const useAusentismos = () => {
    const [motivo, setMotivo] = useState<MotivoAusentismo | null>(null);
    const [comentario, setComentario] = useState('');
    const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
    const [enviando, setEnviando] = useState(false);
    const [errorForm, setErrorForm] = useState<string | null>(null);
    const [exitoForm, setExitoForm] = useState<string | null>(null);

    const [ausentismos, setAusentismos] = useState<AusentismoResumen[]>([]);
    const [cargandoLista, setCargandoLista] = useState(true);
    const [errorLista, setErrorLista] = useState<string | null>(null);

    const cargarHistorial = async () => {
        setCargandoLista(true);
        setErrorLista(null);
        try {
            const resultado = await obtenerMisAusentismos();
            setAusentismos(resultado.datos);
        } catch (err) {
            setErrorLista(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setCargandoLista(false);
        }
    };

    useEffect(() => {
        cargarHistorial();
    }, []);

    const seleccionarMotivo = (valor: MotivoAusentismo) => {
        // Checkbox de seleccion unica: si ya estaba marcado, lo desmarca; si no, reemplaza
        // cualquier otro motivo que estuviera marcado (nunca hay mas de uno a la vez).
        setMotivo((actual) => (actual === valor ? null : valor));
        setErrorForm(null);
        setExitoForm(null);
    };

    const manejarCrear = async () => {
        setErrorForm(null);
        setExitoForm(null);
        if (!motivo) {
            setErrorForm('Selecciona un motivo');
            return;
        }
        if (!comentario.trim()) {
            setErrorForm('Escribe un comentario explicando el motivo del ausentismo');
            return;
        }
        if (diasSeleccionados.length === 0) {
            setErrorForm('Selecciona al menos un día');
            return;
        }
        setEnviando(true);
        try {
            await crearAusentismo(motivo, comentario.trim(), diasSeleccionados);
            setMotivo(null);
            setComentario('');
            setDiasSeleccionados([]);
            setExitoForm('Ausentismo enviado correctamente');
            await cargarHistorial();
        } catch (err) {
            setErrorForm(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    };

    return {
        motivo, seleccionarMotivo,
        comentario, setComentario,
        diasSeleccionados, setDiasSeleccionados,
        enviando, errorForm, exitoForm,
        manejarCrear,
        ausentismos, cargandoLista, errorLista,
        MOTIVOS_AUSENTISMO,
    };
};