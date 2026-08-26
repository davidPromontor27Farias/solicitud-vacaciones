import { createContext, useContext, useState, type ReactNode } from 'react';
import { getJefeSesion, limpiarSesionJefe, type JefeSesion } from '../api/client';
import { loginJefe as loginJefeApi } from '../api/jefe';

interface JefeAuthContextValue {
    jefe: JefeSesion | null;
    estaAutenticado: boolean;
    iniciarSesion: (numeroEmpleado: string, password: string) => Promise<void>;
    cerrarSesion: () => void;
}

const JefeAuthContext = createContext<JefeAuthContextValue | null>(null);

export function JefeAuthProvider({ children }: { children: ReactNode }) {
    const [jefe, setJefe] = useState<JefeSesion | null>(() => getJefeSesion());

    async function iniciarSesion(numeroEmpleado: string, password: string) {
        const jefeLogueado = await loginJefeApi(numeroEmpleado, password);
        setJefe(jefeLogueado);
    }

    function cerrarSesion() {
        limpiarSesionJefe();
        setJefe(null);
    }

    return (
        <JefeAuthContext.Provider value={{ jefe, estaAutenticado: !!jefe, iniciarSesion, cerrarSesion }}>
            {children}
        </JefeAuthContext.Provider>
    );
}

export function useJefeAuth(): JefeAuthContextValue {
    const context = useContext(JefeAuthContext);
    if (!context) {
        throw new Error('useJefeAuth debe usarse dentro de JefeAuthProvider');
    }
    return context;
}
