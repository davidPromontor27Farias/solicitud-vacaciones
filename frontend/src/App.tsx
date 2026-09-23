

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { JefeAuthProvider } from './context/JefeAuthContext';
import { RutaProtegida } from './routes/RutaProtegida';
import { RutaProtegidaAdmin } from './routes/RutaProtegidaAdmin';
import { RutaProtegidaJefe } from './routes/RutaProtegidaJefe';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { JefeLayout } from './components/JefeLayout';
import { LoginPage } from './pages/LoginPage';
import { ActivarCuentaPage } from './pages/ActivarCuentaPage';
import { DashboardPage } from './pages/DashboardPage';
import { RevisarSolicitudPage } from './pages/RevisarSolicitudPage';
import { RecuperarPasswordPage } from './pages/RecuperarPasswordPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminNominasPage } from './pages/AdminNominasPage';
import { JefeEquipoPage } from './pages/JefeEquipoPage';
import { JefeCalendarioPage } from './pages/JefeCalendarioPage';
import { JefeTodosDepartamentosPage } from './pages/JefeTodosDepartamentosPage';
import { JefeMatricialPage } from './pages/JefeMatricialPage';

export default function App() {
    return (
        <AuthProvider>
            <AdminAuthProvider>
            <JefeAuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/activar" element={<ActivarCuentaPage />} />
                        <Route path="/recuperar" element={<RecuperarPasswordPage />} />
                        <Route path="/revisar/:token" element={<RevisarSolicitudPage />} />
                        <Route element={<RutaProtegida />}>
                            <Route element={<Layout />}>
                                <Route path="/" element={<DashboardPage />} />
                            </Route>
                        </Route>
                        <Route path="/admin/login" element={<AdminLoginPage />} />
                        <Route element={<RutaProtegidaAdmin />}>
                            <Route element={<AdminLayout />}>
                                <Route path="/admin" element={<AdminNominasPage />} />
                                <Route path="/admin/reporte-vacaciones" element={<AdminNominasPage />} />
                                <Route path="/admin/historial-cargas" element={<AdminNominasPage />} />
                                <Route path="/admin/nomina-solicitudes" element={<AdminNominasPage />} />
                                <Route path="/admin/nomina-reportes" element={<AdminNominasPage />} />
                            </Route>
                        </Route>
                        <Route element={<RutaProtegidaJefe />}>
                            <Route element={<JefeLayout />}>
                                <Route path="/panel-jefe" element={<JefeEquipoPage />} />
                                <Route path="/panel-jefe/calendario" element={<JefeCalendarioPage />} />
                                <Route path="/panel-jefe/departamentos" element={<JefeTodosDepartamentosPage />} />
                                <Route path="/panel-jefe/matricial" element={<JefeMatricialPage />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </JefeAuthProvider>
            </AdminAuthProvider>
        </AuthProvider>
    )
}