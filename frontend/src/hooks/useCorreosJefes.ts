

import { useEffect, useState } from 'react';
import {
    subirCorreosJefes,
    listarCorreosJefes,
    eliminarCorreoJefe,
    type ActualizarCorreosJefesResultado,
    type CorreoJefeItem,
} from '../api/admin';
import { ApiError } from '../api/client';


export const useCorreosJefes = () => {
    const [archivo, setArchivo] = useState<File | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [resultado, setResultado] = useState<ActualizarCorreosJefesResultado | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<CorreoJefeItem[]>([]);
    const [cargandoLista, setCargandoLista] = useState(true);
    const [errorLista, setErrorLista] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [modal, setModal] = useState<{ modo: 'agregar' | 'editar'; item?: CorreoJefeItem } | null>(null);
    const [eliminando, setEliminando] = useState<string | null>(null);

    const cargarLista = () => {
        setCargandoLista(true);
        setErrorLista(null);
        listarCorreosJefes()
            .then(setItems)
            .catch((err) => setErrorLista(err instanceof ApiError ? err.message : 'Error inesperado al cargar los jefes'))
            .finally(() => setCargandoLista(false));
    };

    useEffect(() => {
        cargarLista();
    }, []);

    const subir = async () => {
        if (!archivo) return;
        setSubiendo(true);
        setError(null);
        setResultado(null);
        try {
            const res = await subirCorreosJefes(archivo);
            setResultado(res);
            cargarLista();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado al subir el archivo');
        } finally {
            setSubiendo(false);
        }
    };

    const eliminar = async (item: CorreoJefeItem) => {
        if (!window.confirm(`¿Quitar el correo de autorización de ${item.nombre}?`)) return;
        setEliminando(item.numeroEmpleado);
        try {
            await eliminarCorreoJefe(item.numeroEmpleado);
            cargarLista();
        } catch (err) {
            setErrorLista(err instanceof ApiError ? err.message : 'Error inesperado al eliminar el correo');
        } finally {
            setEliminando(null);
        }
    };

    const conCorreo = items.filter((i) => i.correoAutorizacion);
    const busquedaNorm = busqueda.trim().toLowerCase();
    const filasVisibles = busquedaNorm
        ? conCorreo.filter((i) => i.nombre.toLowerCase().includes(busquedaNorm) || i.numeroEmpleado.toLowerCase().includes(busquedaNorm))
        : conCorreo;

    return {
        archivo, setArchivo, subiendo, subir, error, resultado,
        cargandoLista, errorLista, busqueda, setBusqueda,
        conCorreo, filasVisibles,
        modal, setModal, eliminando, eliminar, cargarLista,
    };
};