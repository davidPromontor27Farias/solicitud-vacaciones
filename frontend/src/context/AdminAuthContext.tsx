import { createContext, useContext, useState, type ReactNode } from 'react';
import { getAdminSesion, limpiarSesionAdmin, type AdminSesion } from '../api/client';
import { loginAdmin as loginAdminApi } from '../api/admin';

interface AdminAuthContextValue {
    admin: AdminSesion | null;
    estaAutenticado: boolean;
    iniciarSesion: (usuario: string, password: string) => Promise<void>;
    cerrarSesion: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [admin, setAdmin] = useState<AdminSesion | null>(() => getAdminSesion());

    async function iniciarSesion(usuario: string, password: string) {
        const adminLogueado = await loginAdminApi(usuario, password);
        setAdmin(adminLogueado);
    }

    function cerrarSesion() {
        limpiarSesionAdmin();
        setAdmin(null);
    }

    return (
        <AdminAuthContext.Provider value={{ admin, estaAutenticado: !!admin, iniciarSesion, cerrarSesion }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth(): AdminAuthContextValue {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth debe usarse dentro de AdminAuthProvider');
    }
    return context;
}
