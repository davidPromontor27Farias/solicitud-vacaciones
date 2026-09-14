import { useEffect, useState } from 'react';
import { obtenerArbolMatricial, type NodoMatricial } from '../api/jefe';
import { ApiError } from '../api/client';
import { useJefeAuth } from '../context/JefeAuthContext';

export const useJefeMatricialPage = () => {
    const { jefe } = useJefeAuth();
    const [arbol, setArbol] = useState<NodoMatricial | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nodoSeleccionado, setNodoSeleccionado] = useState<NodoMatricial | null>(null);

    useEffect(() => {
        if (!jefe?.tieneMatricial) {
            setCargando(false);
            return;
        }
        obtenerArbolMatricial()
            .then(setArbol)
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Error inesperado'))
            .finally(() => setCargando(false));
    }, [jefe?.tieneMatricial]);

    return { jefe, arbol, cargando, error, nodoSeleccionado, setNodoSeleccionado };
};
