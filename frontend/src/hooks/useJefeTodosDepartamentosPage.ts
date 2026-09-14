import { useEffect, useMemo, useState } from 'react';
import { obtenerTodosLosDepartamentos, type EmpleadoEquipo, type EstadoSaldo } from '../api/jefe';
import { ApiError } from '../api/client';
import { useJefeAuth } from '../context/JefeAuthContext';
import {
    agruparPorEmpleado,
    agruparPorDepartamento,
    departamentosConRiesgo,
    obtenerPeriodoCercano,
    type EmpleadoCercano,
} from '../components/todosDepartamentos/utils';

export type FiltroSemaforo = 'todos' | EstadoSaldo;

export const useJefeTodosDepartamentosPage = () => {
    const { jefe } = useJefeAuth();
    const [equipo, setEquipo] = useState<EmpleadoEquipo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<FiltroSemaforo>('todos');
    const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<string | null>(null);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string | null>(null);
    const [filtroDepartamentos, setFiltroDepartamentos] = useState<'todos' | 'vencido' | 'critico'>('todos');

    useEffect(() => {
        if (!jefe?.accesoTotal) {
            setCargando(false);
            return;
        }
        obtenerTodosLosDepartamentos()
            .then(setEquipo)
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    }, [jefe?.accesoTotal]);

    const resumenesEmpleados = useMemo(() => agruparPorEmpleado(equipo), [equipo]);
    const departamentos = useMemo(() => agruparPorDepartamento(resumenesEmpleados), [resumenesEmpleados]);
    const departamentosRiesgo = useMemo(() => departamentosConRiesgo(departamentos), [departamentos]);
    const departamentosFiltrados = useMemo(() => {
        if (filtroDepartamentos === 'todos') return departamentosRiesgo;
        return departamentosRiesgo.filter((d) => d.porEstado[filtroDepartamentos].cantidad > 0);
    }, [departamentosRiesgo, filtroDepartamentos]);

    const conVencido = resumenesEmpleados.filter((r) => r.porEstado.vencido.cantidad > 0).length;
    const conCritico = resumenesEmpleados.filter((r) => r.porEstado.critico.cantidad > 0).length;
    const conVigente = resumenesEmpleados.filter((r) => r.porEstado.vigente.cantidad > 0).length;

    const empleadoDetalle = empleadoSeleccionado ? equipo.find((e) => e.empleadoId === empleadoSeleccionado) ?? null : null;
    const departamentoActivo = departamentoSeleccionado
        ? departamentos.find((d) => d.departamento === departamentoSeleccionado) ?? null
        : null;

    const empleadosCercanosDelDepartamento: EmpleadoCercano[] = useMemo(() => {
        if (!departamentoSeleccionado) return [];
        return equipo
            .filter((e) => (e.departamento ?? 'Sin departamento') === departamentoSeleccionado && e.saldos.length > 0)
            .map((e) => {
                const cercano = obtenerPeriodoCercano(e.saldos);
                return {
                    empleadoId: e.empleadoId,
                    nombre: e.nombre,
                    departamento: e.departamento ?? 'Sin departamento',
                    dias: cercano.diasPendientes,
                    estado: cercano.estado,
                    fecha: cercano.fechaLimiteDisfrute,
                };
            })
            .filter((e) => filtro === 'todos' || e.estado === filtro)
            .sort((a, b) => a.fecha.localeCompare(b.fecha));
    }, [equipo, departamentoSeleccionado, filtro]);

    const SEMAFORO: { id: FiltroSemaforo; label: string; punto: string; cantidad: number }[] = [
        { id: 'todos', label: 'Todos', punto: 'bg-white/60', cantidad: resumenesEmpleados.length },
        { id: 'vencido', label: 'Vencidos', punto: 'bg-red-400', cantidad: conVencido },
        { id: 'critico', label: 'Por vencer', punto: 'bg-amber-400', cantidad: conCritico },
        { id: 'vigente', label: 'Vigentes', punto: 'bg-emerald-400', cantidad: conVigente },
    ];

    const SEMAFORO_DEPARTAMENTOS: { id: 'todos' | 'vencido' | 'critico'; label: string; punto: string; cantidad: number }[] = [
        { id: 'todos', label: 'Todos', punto: 'bg-white/60', cantidad: departamentosRiesgo.length },
        { id: 'vencido', label: 'Vencidos', punto: 'bg-red-400', cantidad: departamentosRiesgo.filter((d) => d.porEstado.vencido.cantidad > 0).length },
        { id: 'critico', label: 'Por vencer', punto: 'bg-amber-400', cantidad: departamentosRiesgo.filter((d) => d.porEstado.critico.cantidad > 0).length },
    ];

    return {
        jefe, cargando, error,
        filtro, setFiltro,
        departamentoSeleccionado, setDepartamentoSeleccionado,
        empleadoSeleccionado, setEmpleadoSeleccionado,
        filtroDepartamentos, setFiltroDepartamentos,
        departamentosRiesgo, departamentosFiltrados,
        empleadoDetalle, departamentoActivo,
        empleadosCercanosDelDepartamento,
        SEMAFORO, SEMAFORO_DEPARTAMENTOS,
    };
};