import { useState } from 'react';
import { descargarReporteSolicitudes, descargarReporteVacacionesPeriodo, type EstatusSolicitud } from '../api/admin';
import { ApiError } from '../api/client';

// Devuelve el "Desde"/"Hasta" (YYYY-MM-DD) de la quincena en curso, según la fecha de hoy:
// del 1 al 15, o del 16 al último día del mes.
function quincenaActual(): { desde: string; hasta: string } {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();
    const dia = hoy.getDate();
    const pad = (n: number) => String(n).padStart(2, '0');

    if (dia <= 15) {
        return { desde: `${anio}-${pad(mes + 1)}-01`, hasta: `${anio}-${pad(mes + 1)}-15` };
    }
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    return { desde: `${anio}-${pad(mes + 1)}-16`, hasta: `${anio}-${pad(mes + 1)}-${pad(ultimoDia)}` };
}

export const useReportesDescarga = () => {
    const [descargando, setDescargando] = useState<EstatusSolicitud | null>(null);
    const [error, setError] = useState<string | null>(null);

    const defaultQuincena = quincenaActual();
    const [desde, setDesde] = useState(defaultQuincena.desde);
    const [hasta, setHasta] = useState(defaultQuincena.hasta);
    const [descargandoPeriodo, setDescargandoPeriodo] = useState(false);
    const [errorPeriodo, setErrorPeriodo] = useState<string | null>(null);

    const descargar = async (estatus: EstatusSolicitud) => {
        setDescargando(estatus);
        setError(null);
        try {
            await descargarReporteSolicitudes(estatus);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado al descargar el reporte');
        } finally {
            setDescargando(null);
        }
    };

    const descargarPeriodo = async () => {
        setDescargandoPeriodo(true);
        setErrorPeriodo(null);
        try {
            await descargarReporteVacacionesPeriodo(desde, hasta);
        } catch (err) {
            setErrorPeriodo(err instanceof ApiError ? err.message : 'Error inesperado al descargar el reporte');
        } finally {
            setDescargandoPeriodo(false);
        }
    };

    return {
        descargando, error, descargar,
        desde, setDesde, hasta, setHasta,
        descargandoPeriodo, errorPeriodo, descargarPeriodo,
    };
};