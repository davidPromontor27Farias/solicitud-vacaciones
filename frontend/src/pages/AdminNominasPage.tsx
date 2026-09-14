import { FileSpreadsheet } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useLocation } from 'react-router-dom';
import { SeccionCorreosJefes } from '../components/nominas/SeccionCorreosJefes';
import { SeccionReporteVacaciones } from '../components/nominas/SeccionReporteVacaciones';
import { SeccionHistorial } from '../components/nominas/SeccionHistorial';
import { SeccionSolicitudes } from '../components/nominas/SeccionSolicitudes';
import { SeccionReportes } from '../components/nominas/SeccionReportes';
type Seccion = 'correos' | 'vacaciones' | 'historial' | 'solicitudes' | 'reportes';

// Mismas rutas que usan los enlaces de navegación en AdminLayout.
const RUTA_POR_SECCION: Record<string, Seccion> = {
    '/admin': 'correos',
    '/admin/reporte-vacaciones': 'vacaciones',
    '/admin/historial-cargas': 'historial',
    '/admin/nomina-solicitudes': 'solicitudes',
    '/admin/nomina-reportes': 'reportes',
};



export function AdminNominasPage() {
    const { admin } = useAdminAuth();
    const location = useLocation();
    const seccion: Seccion = RUTA_POR_SECCION[location.pathname] ?? 'correos';

    return (
        <div className="space-y-6">
            <section className="bg-linear-to-r from-[#4a8b2c] to-[#ee7624] p-8 rounded-2xl shadow-lg text-white">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-4 rounded-full">
                        <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Panel de Nóminas</h1>
                        <p className="text-white/80 text-sm">
                            {admin ? `Bienvenido, ${admin.nombre}` : 'Panel de nóminas'}
                        </p>
                    </div>
                </div>
            </section>

            {seccion === 'correos' && <SeccionCorreosJefes />}
            {seccion === 'vacaciones' && <SeccionReporteVacaciones />}
            {seccion === 'historial' && <SeccionHistorial />}
            {seccion === 'solicitudes' && <SeccionSolicitudes />}
            {seccion === 'reportes' && <SeccionReportes />}
        </div>
    );
}
