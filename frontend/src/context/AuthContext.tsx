import { createContext, useContext, useState, type ReactNode } from 'react';
import { getUsuarioSesion, limpiarSesion, type UsuarioSesion } from '../api/client';
import { login as loginApi } from '../api/auth';

interface AuthContextValue {
    usuario: UsuarioSesion | null;
    estaAutenticado: boolean;
    iniciarSesion: (numeroEmpleado: string, password: string) => Promise<void>;
    cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<UsuarioSesion | null>(() => getUsuarioSesion());

    async function iniciarSesion(numeroEmpleado: string, password: string) {
        const usuarioLogueado = await loginApi(numeroEmpleado, password);
        setUsuario(usuarioLogueado);
    }

    function cerrarSesion() {
        limpiarSesion();
        setUsuario(null);
    }

    return (
        <AuthContext.Provider value={{ usuario, estaAutenticado: !!usuario, iniciarSesion, cerrarSesion }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
}