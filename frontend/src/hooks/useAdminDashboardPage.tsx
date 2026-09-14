

import { useLocation } from 'react-router-dom';
import { obtenerVacacionesCriticas, obtenerDetalleEmpleado, type VacacionCritica, type DetalleEmpleadoAdmin } from '../api/admin';
import { ApiError } from '../api/client';
import { agruparPorDepartamento } from '../components/vacacionesCriticas/utils';
import { useEffect, useMemo, useState } from 'react';

export type Filtro = 'vencido' | 'critico';
export type ModoVista = 'tarjetas' | 'listado';
type Seccion = 'dashboards' | 'registros';

export const useAdminDashboardPage = () => {
    const location = useLocation();
    const seccion: Seccion = location.pathname === '/admin/registros' ? 'registros' : 'dashboards';

    const [items, setItems] = useState<VacacionCritica[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState<Filtro>('vencido');
    const [modoVista, setModoVista] = useState<ModoVista>('tarjetas');
    const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<string | null>(null);
    const [paginaDepartamentos, setPaginaDepartamentos] = useState(1);
    const [paginaEmpleados, setPaginaEmpleados] = useState(1);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string | null>(null);
    const [filtroDetalle, setFiltroDetalle] = useState<Filtro>('vencido');
    const [detalleEmpleado, setDetalleEmpleado] = useState<DetalleEmpleadoAdmin | null>(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

    useEffect(() => {
        setDepartamentoSeleccionado(null);
        setPaginaDepartamentos(1);
        setPaginaEmpleados(1);
        setEmpleadoSeleccionado(null);
    }, [busqueda, filtro]);

    useEffect(() => {
        setPaginaEmpleados(1);
        setEmpleadoSeleccionado(null);
    }, [departamentoSeleccionado]);

    useEffect(() => {
        if (!empleadoSeleccionado) {
            setDetalleEmpleado(null);
            return;
        }
        setCargandoDetalle(true);
        setErrorDetalle(null);
        obtenerDetalleEmpleado(empleadoSeleccionado)
            .then(setDetalleEmpleado)
            .catch((err) => setErrorDetalle(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargandoDetalle(false));
    }, [empleadoSeleccionado]);

    useEffect(() => {
        obtenerVacacionesCriticas()
            .then(setItems)
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    }, []);

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        if (!termino) return items;
        return items.filter(
            (i) => i.nombre.toLowerCase().includes(termino) || i.departamento.toLowerCase().includes(termino),
        );
    }, [items, busqueda]);

    const vencidos = filtrados.filter((i) => i.estado === 'vencido');
    const criticos = filtrados.filter((i) => i.estado === 'critico');
    const totalDiasVencidos = vencidos.reduce((acc, i) => acc + i.diasPendientes, 0);
    const totalDiasCriticos = criticos.reduce((acc, i) => acc + i.diasPendientes, 0);
    const empleadosAfectados = new Set(filtrados.map((i) => i.empleadoId)).size;

    const itemsActivos = filtro === 'vencido' ? vencidos : criticos;
    const esVencidoActivo = filtro === 'vencido';
    const departamentosActivos = useMemo(() => agruparPorDepartamento(itemsActivos), [itemsActivos]);
    const topDepartamentoVencido = useMemo(() => agruparPorDepartamento(vencidos)[0], [vencidos]);
    const topDepartamentoCritico = useMemo(() => agruparPorDepartamento(criticos)[0], [criticos]);
    const grupoSeleccionado = departamentoSeleccionado
        ? departamentosActivos.find((d) => d.departamento === departamentoSeleccionado)
        : undefined;

    return {
        seccion,
        items, cargando, error,
        busqueda, setBusqueda,
        filtro, setFiltro,
        modoVista, setModoVista,
        departamentoSeleccionado, setDepartamentoSeleccionado,
        paginaDepartamentos, setPaginaDepartamentos,
        paginaEmpleados, setPaginaEmpleados,
        empleadoSeleccionado, setEmpleadoSeleccionado,
        filtroDetalle, setFiltroDetalle,
        detalleEmpleado, cargandoDetalle, errorDetalle,
        filtrados, vencidos, criticos,
        totalDiasVencidos, totalDiasCriticos, empleadosAfectados,
        itemsActivos, esVencidoActivo,
        departamentosActivos, topDepartamentoVencido, topDepartamentoCritico, grupoSeleccionado,
    };
};
