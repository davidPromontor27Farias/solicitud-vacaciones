import { FileSpreadsheet } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export function AdminNominasPage() {
    const { admin } = useAdminAuth();

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

            <section className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl p-10 rounded-2xl text-center">
                <FileSpreadsheet className="w-12 h-12 text-white/60 mx-auto mb-3" />
                <p className="text-white font-medium">Próximamente</p>
                <p className="text-white/60 text-sm mt-1">Esta sección todavía no tiene funcionalidad.</p>
            </section>
        </div>
    );
}
