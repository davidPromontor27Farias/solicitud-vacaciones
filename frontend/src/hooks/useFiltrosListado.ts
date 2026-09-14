
import { useMemo, useState } from 'react';
import { descargarReporteVacacionesCriticas, type VacacionCritica } from '../api/admin';
import { ApiError } from '../api/client';

export const useFiltrosListado = (vencidos: VacacionCritica[], criticos: VacacionCritica[]) => {
    const [sociedad, setSociedad] = useState('');
    const [departamento, setDepartamento] = useState('');
    const [descargando, setDescargando] = useState(false);
    const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

    const todos = useMemo(() => [...vencidos, ...criticos], [vencidos, criticos]);

    const exportarExcel = async () => {
        setDescargando(true);
        setErrorDescarga(null);
        try {
            await descargarReporteVacacionesCriticas(sociedad || undefined, departamento || undefined);
        } catch (err) {
            setErrorDescarga(err instanceof ApiError ? err.message : 'No se pudo generar el Excel');
        } finally {
            setDescargando(false);
        }
    };
    const sociedades = useMemo(
        () => [...new Set(todos.map((i) => i.sociedad).filter((s): s is string => Boolean(s)))].sort(),
        [todos],
    );
    const departamentos = useMemo(
        () => [...new Set(todos.map((i) => i.departamento).filter((d): d is string => Boolean(d)))].sort(),
        [todos],
    );

    const aplicarFiltros = (items: VacacionCritica[]): VacacionCritica[] => {
        return items.filter(
            (i) => (!sociedad || i.sociedad === sociedad) && (!departamento || i.departamento === departamento),
        );
    };

    const hayFiltros = Boolean(sociedad || departamento);
    const limpiarFiltros = () => { setSociedad(''); setDepartamento(''); };

    return {
        sociedad, setSociedad, departamento, setDepartamento,
        sociedades, departamentos,
        descargando, errorDescarga, exportarExcel,
        aplicarFiltros, hayFiltros, limpiarFiltros,
    };
};