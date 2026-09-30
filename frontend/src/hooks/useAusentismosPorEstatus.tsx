import { useEffect, useState } from 'react';
import { obtenerAusentismosPorEstatus, type EstatusAusentismo, type AusentismoPorEstatus } from '../api/admin';
import { ApiError } from '../api/client';

const POR_PAGINA = 10;

export const useAusentismosPorEstatus = () => {
    const [estatus, setEstatus] = useState<EstatusAusentismo>('pendiente');
    const [pagina, setPagina] = useState(1);
    const [datos, setDatos] = useState<AusentismoPorEstatus[]>([]);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setPagina(1);
    }, [estatus]);

    useEffect(() => {
        setCargando(true);
        setError(null);
        obtenerAusentismosPorEstatus(estatus, pagina)
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