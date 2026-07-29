import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export function RutaProtegidaAdmin() {
    const { estaAutenticado } = useAdminAuth();
    const location = useLocation();
    if (!estaAutenticado) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
}
