import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout() {
    const { cerrarSesion } = useAuth();

    return (
        <div className="min-h-screen relative bg-gray-50">

            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('/walppaper.jpg')`, // Reemplaza 'tu-imagen.jpg' con el nombre de tu archivo
                }}
                
            />
            <div className="absolute inset-0 bg-black/50" />


            <div   className='z-10 relative'>
                <header className="bg-white border-b border-gray-200 px-4 flex items-center justify-between">
                    <nav className="flex gap-4 text-sm font-medium text-gray-600 items-center">
                        <img className='w-[60px]' src="/iconIQ.png"/>
                    </nav>
                    <div className="flex items-center gap-4 text-sm">
                        <button onClick={cerrarSesion} className="text-red-600 hover:text-red-800 cursor-pointer">Cerrar sesión</button>
                    </div>
                </header>
                <main className="max-w-4xl mx-auto px-6 py-8">
                    <Outlet />
                </main>

            </div>


        </div>
    );
}