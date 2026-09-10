

import { useEffect, useState } from 'react';
import { obtenerSolicitudesPorEstatus, type EstatusSolicitud, type SolicitudPorEstatus } from '../api/admin';
import { ApiError } from '../api/client';

const POR_PAGINA = 10;

export const useSolicitudesPorEstatus = () => {
    const [estatus, setEstatus] = useState<EstatusSolicitud>('pendiente');
    const [pagina, setPagina] = useState(1);
    const [datos, setDatos] = useState<SolicitudPorEstatus[]>([]);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setPagina(1);
    }, [estatus]);

    useEffect(() => {
        setCargando(true);
        setError(null);
        obtenerSolicitudesPorEstatus(estatus, pagina)
            .then((res) => {
                setDatos(res.datos);
                setTotal(res.total);
            })
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    }, [estatus, pagina]);

    const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

    return { estatus, setEstatus, pagina, setPagina, datos, cargando, error, totalPaginas };
};
