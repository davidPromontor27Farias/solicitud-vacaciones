import { useEffect, useState } from 'react';
import { obtenerHistorialCargas, type HistorialCargaItem } from '../api/admin';
import { ApiError } from '../api/client';

export const useHistorialCargas = () => {
    const [items, setItems] = useState<HistorialCargaItem[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandido, setExpandido] = useState<string | null>(null);

    const cargar = () => {
        setCargando(true);
        setError(null);
        obtenerHistorialCargas()
            .then(setItems)
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado al cargar el historial'))
            .finally(() => setCargando(false));
    };

    useEffect(() => {
        cargar();
    }, []);

    return { items, cargando, error, expandido, setExpandido, cargar };
};