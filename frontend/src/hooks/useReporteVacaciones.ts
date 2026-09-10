import { useState } from 'react';
import { subirReporteVacaciones, type ImportarReporteVacacionesResultado } from '../api/admin';
import { ApiError } from '../api/client';

export const useReporteVacaciones = () => {
    const [archivo, setArchivo] = useState<File | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [resultado, setResultado] = useState<ImportarReporteVacacionesResultado | null>(null);
    const [error, setError] = useState<string | null>(null);

    const subir = async () => {
        if (!archivo) return;
        setSubiendo(true);
        setError(null);
        setResultado(null);
        try {
            const res = await subirReporteVacaciones(archivo);
            setResultado(res);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado al subir el archivo');
        } finally {
            setSubiendo(false);
        }
    };

    return { archivo, setArchivo, subiendo, subir, error, resultado };
};