import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RutaProtegida() {
    const { estaAutenticado } = useAuth();
    const location = useLocation();
    if (!estaAutenticado) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
}