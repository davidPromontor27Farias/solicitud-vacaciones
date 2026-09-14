import { useEffect, useMemo, useState } from 'react';
import {
    obtenerEquipo,
    obtenerVacacionesEquipo,
    type EmpleadoEquipo,
    type VacacionAprobadaEquipo,
} from '../api/jefe';
import { ApiError } from '../api/client';
import { calcularCriticos, hoyISO, obtenerMatrizMes } from '../components/calendarioJefe/utils';

export const useJefeCalendarioPage = () => {
    const [equipo, setEquipo] = useState<EmpleadoEquipo[]>([]);
    const [vacaciones, setVacaciones] = useState<VacacionAprobadaEquipo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [vacacionSeleccionada, setVacacionSeleccionada] = useState<VacacionAprobadaEquipo | null>(null);

    const ahora = new Date();
    const [anio, setAnio] = useState(ahora.getFullYear());
    const [mes, setMes] = useState(ahora.getMonth());

    const cargarDatos = () => {
        setCargando(true);
        setError(null);
        return Promise.all([obtenerEquipo(), obtenerVacacionesEquipo()])
            .then(([equipoRes, vacacionesRes]) => {
                setEquipo(equipoRes);
                setVacaciones(vacacionesRes);
            })
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    };

    useEffect(() => {
        cargarDatos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Los reportes matriciales no siempre vienen en obtenerEquipo() (esa lista es solo de
    // linea directa), asi que el nombre tambien se toma de la propia vacacion si hace falta.
    const nombrePorEmpleadoId = useMemo(() => {
        const mapa = new Map(equipo.map((e) => [e.empleadoId, e.nombre]));
        for (const v of vacaciones) {
            if (!mapa.has(v.empleadoId)) mapa.set(v.empleadoId, v.empleadoNombre);
        }
        return mapa;
    }, [equipo, vacaciones]);

    const criticos = useMemo(() => calcularCriticos(equipo), [equipo]);
    const estadoCriticoPorEmpleadoId = useMemo(
        () => new Map(criticos.map((c) => [c.empleadoId, c.estado])),
        [criticos],
    );

    const vacacionesPorDia = useMemo(() => {
        const mapa = new Map<string, VacacionAprobadaEquipo[]>();
        for (const v of vacaciones) {
            for (const dia of v.dias) {
                const lista = mapa.get(dia) ?? [];
                lista.push(v);
                mapa.set(dia, lista);
            }
        }
        return mapa;
    }, [vacaciones]);

    const semanas = useMemo(() => obtenerMatrizMes(anio, mes), [anio, mes]);
    const nombreMes = new Date(Date.UTC(anio, mes, 1)).toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const hoy = hoyISO();

    const cambiarMes = (delta: number) => {
        const nuevaFecha = new Date(Date.UTC(anio, mes + delta, 1));
        setAnio(nuevaFecha.getUTCFullYear());
        setMes(nuevaFecha.getUTCMonth());
    };

    const irAHoy = () => {
        setAnio(ahora.getFullYear());
        setMes(ahora.getMonth());
    };

    return {
        cargando, error,
        vacacionSeleccionada, setVacacionSeleccionada,
        mes, semanas, nombreMes, hoy,
        nombrePorEmpleadoId, estadoCriticoPorEmpleadoId, vacacionesPorDia,
        cambiarMes, irAHoy, cargarDatos,
    };
};