import { useEffect, useState } from 'react';
import { crearSolicitud, obtenerMisSolicitudes, type SolicitudResumen } from '../api/solicitudes';
import { obtenerPerfil, type PerfilEmpleado } from '../api/empleados';
import { ApiError } from '../api/client';
import { diasFinDeMes } from '../utils/fechas';

export type TabId = 'informacion' | 'nueva' | 'mis';

export const useDashboardPage = () => {
    const [tabActivo, setTabActivoInterno] = useState<TabId>('informacion');
    const [perfil, setPerfil] = useState<PerfilEmpleado | null>(null);
    const [cargandoPerfil, setCargandoPerfil] = useState(true);
    const [errorPerfil, setErrorPerfil] = useState<string | null>(null);

    const [solicitudes, setSolicitudes] = useState<SolicitudResumen[]>([]);
    const [cargandoLista, setCargandoLista] = useState(true);
    const [errorLista, setErrorLista] = useState<string | null>(null);

    const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
    const [errorForm, setErrorForm] = useState<string | null>(null);
    const [exitoForm, setExitoForm] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    const cargarPerfil = async () => {
        setCargandoPerfil(true);
        setErrorPerfil(null);
        try {
            const p = await obtenerPerfil();
            setPerfil(p);
        } catch (err) {
            setErrorPerfil(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setCargandoPerfil(false);
        }
    };

    const cargarHistorial = async () => {
        setCargandoLista(true);
        setErrorLista(null);
        try {
            const resultado = await obtenerMisSolicitudes();
            setSolicitudes(resultado.datos);
        } catch (err) {
            setErrorLista(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setCargandoLista(false);
        }
    };

    useEffect(() => {
        cargarPerfil();
        cargarHistorial();
    }, []);

    useEffect(() => {
        const alRecuperarFoco = () => {
            if (document.visibilityState === 'visible') {
                cargarPerfil();
                cargarHistorial();
            }
        };
        document.addEventListener('visibilitychange', alRecuperarFoco);
        window.addEventListener('focus', alRecuperarFoco);
        return () => {
            document.removeEventListener('visibilitychange', alRecuperarFoco);
            window.removeEventListener('focus', alRecuperarFoco);
        };
    }, []);

    const manejarCrear = async () => {
        setErrorForm(null);
        setExitoForm(null);
        if (diasSeleccionados.length === 0) {
            setErrorForm('Selecciona al menos un día en el calendario');
            return;
        }
        setEnviando(true);
        try {
            await crearSolicitud(diasSeleccionados);
            setDiasSeleccionados([]);
            await Promise.all([cargarHistorial(), cargarPerfil()]);
            setExitoForm('Solicitud enviada correctamente');
            setTimeout(() => setTabActivo('mis'), 1200);
        } catch (err) {
            setErrorForm(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setEnviando(false);
        }
    };

    const finDeMesSeleccionados = diasFinDeMes(diasSeleccionados);

    // El aviso de exito/error de "Nueva solicitud" solo tiene sentido justo despues de
    // enviar: si el usuario cambia de dias o sale y vuelve a la pestana, ya no aplica.
    const setTabActivo = (tab: TabId) => {
        setErrorForm(null);
        setExitoForm(null);
        setTabActivoInterno(tab);
    };

    const manejarCambiarDias = (dias: string[]) => {
        setErrorForm(null);
        setExitoForm(null);
        setDiasSeleccionados(dias);
    };

    return {
        tabActivo, setTabActivo,
        perfil, cargandoPerfil, errorPerfil,
        solicitudes, cargandoLista, errorLista,
        diasSeleccionados, setDiasSeleccionados: manejarCambiarDias,
        errorForm, exitoForm, enviando,
        manejarCrear, finDeMesSeleccionados,
    };
};