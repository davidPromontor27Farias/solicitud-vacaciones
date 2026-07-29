import { Outlet } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

export function AdminLayout() {
    const { admin, cerrarSesion } = useAdminAuth();

    return (
        <div className="min-h-screen relative bg-gray-50">

            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('/walppaper.jpg')`,
                }}
            />
            <div className="absolute inset-0 bg-black/50" />


            <div className='z-10 relative'>
                <header className="bg-white border-b border-gray-200 px-4 flex items-center justify-between">
                    <nav className="flex gap-4 text-sm font-medium text-gray-600 items-center">

                        <img className='w-[60px]' src="/iconIQ.png" />

                        <div className='flex flex-row gap-2 items-center justify-center'>
                            <span className=" text-gray-900 font-semibold">
                                Panel administrativo
                            </span>
                        </div>
                    </nav>
                    <div className="flex items-center gap-4 text-sm">
                        {admin && <span className="text-gray-500 hidden sm:inline">{admin.nombre}</span>}
                        <button onClick={cerrarSesion} className="flex items-center gap-1.5 text-red-600 hover:text-red-800 cursor-pointer">
                            <LogOut className="w-4 h-4" />
                            Cerrar sesión
                        </button>
                    </div>
                </header>
                <main className="max-w-6xl mx-auto px-6 py-8">
                    <Outlet />
                </main>

            </div>


        </div>
    );
}
