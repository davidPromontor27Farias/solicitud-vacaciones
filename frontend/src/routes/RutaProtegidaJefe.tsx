import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useJefeAuth } from '../context/JefeAuthContext';

export function RutaProtegidaJefe() {
    const { estaAutenticado } = useJefeAuth();
    const location = useLocation();
    if (!estaAutenticado) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
}
