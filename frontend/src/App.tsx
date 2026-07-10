

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RutaProtegida } from './routes/RutaProtegida';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { ActivarCuentaPage } from './pages/ActivarCuentaPage';
import { DashboardPage } from './pages/DashboardPage';
import { EquipoPage } from './pages/EquipoPage';
import { RevisarSolicitudPage } from './pages/RevisarSolicitudPage';
import { RecuperarPasswordPage } from './pages/RecuperarPasswordPage';


export default function App() {
    return (
        <AuthProvider>
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
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}