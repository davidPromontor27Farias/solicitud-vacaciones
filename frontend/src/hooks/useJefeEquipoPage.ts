import { useEffect, useMemo, useState } from 'react';
import { obtenerEquipo, type EmpleadoEquipo } from '../api/jefe';
import { ApiError } from '../api/client';
import { construirEmpleadosConPeriodos, type FiltroSemaforo } from '../components/equipoJefe/utils';

export const useJefeEquipoPage = () => {
    const [equipo, setEquipo] = useState<EmpleadoEquipo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<FiltroSemaforo>('todos');

    useEffect(() => {
        obtenerEquipo()
            .then(setEquipo)
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    }, []);

    const empleadosConPeriodos = useMemo(() => construirEmpleadosConPeriodos(equipo), [equipo]);

    const todosLosPeriodos = useMemo(() => empleadosConPeriodos.flatMap((e) => e.periodos), [empleadosConPeriodos]);
    const conVencido = todosLosPeriodos.filter((p) => p.estado === 'vencido').length;
    const conCritico = todosLosPeriodos.filter((p) => p.estado === 'critico').length;
    const conVigente = todosLosPeriodos.filter((p) => p.estado === 'vigente').length;

    const empleadosFiltrados = filtro === 'todos'
        ? empleadosConPeriodos
        : empleadosConPeriodos.filter((e) => e.periodos.some((p) => p.estado === filtro));

    const SEMAFORO: { id: FiltroSemaforo; label: string; punto: string; cantidad: number }[] = [
        { id: 'todos', label: 'Todos', punto: 'bg-white/60', cantidad: todosLosPeriodos.length },
        { id: 'vencido', label: 'Vencidos', punto: 'bg-red-400', cantidad: conVencido },
        { id: 'critico', label: 'Por vencer', punto: 'bg-amber-400', cantidad: conCritico },
        { id: 'vigente', label: 'Vigentes', punto: 'bg-emerald-400', cantidad: conVigente },
    ];

    return {
        equipo, cargando, error,
        filtro, setFiltro,
        empleadosFiltrados,
        SEMAFORO,
    };
};
