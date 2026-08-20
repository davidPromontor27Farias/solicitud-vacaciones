

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { RutaProtegida } from './routes/RutaProtegida';
import { RutaProtegidaAdmin } from './routes/RutaProtegidaAdmin';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { ActivarCuentaPage } from './pages/ActivarCuentaPage';
import { DashboardPage } from './pages/DashboardPage';
import { EquipoPage } from './pages/EquipoPage';
import { RevisarSolicitudPage } from './pages/RevisarSolicitudPage';
import { RecuperarPasswordPage } from './pages/RecuperarPasswordPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminNominasPage } from './pages/AdminNominasPage';
import { useAdminAuth } from './context/AdminAuthContext';

function AdminHomePage() {
    const { admin } = useAdminAuth();
    return admin?.rol === 'nominas' ? <AdminNominasPage /> : <AdminDashboardPage />;
}


export default function App() {
    return (
        <AuthProvider>
            <AdminAuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/activar" element={<ActivarCuentaPage />} />
                        <Route path="/recuperar" element={<RecuperarPasswordPage />} />
                        <Route path="/revisar/:token" element={<RevisarSolicitudPage />} />
                        <Route element={<RutaProtegida />}>
                            <Route element={<Layout />}>
                                <Route path="/" element={<DashboardPage />} />
                                <Route path="/equipo"  element={<EquipoPage/>}/>
                            </Route>
                        </Route>
                        <Route path="/admin/login" element={<AdminLoginPage />} />
                        <Route element={<RutaProtegidaAdmin />}>
                            <Route element={<AdminLayout />}>
                                <Route path="/admin" element={<AdminHomePage />} />
                                <Route path="/admin/registros" element={<AdminHomePage />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AdminAuthProvider>
        </AuthProvider>
    )
}