import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, type Location } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ApiError } from '../api/client';

export function AdminLoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { iniciarSesion } = useAdminAuth();
    const destinoOriginal = (location.state as { from?: Location } | null)?.from;

    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);

    async function manejarLogin(evento: FormEvent) {
        evento.preventDefault();
        setError(null);
        setCargando(true);
        try {
            await iniciarSesion(usuario.trim(), password);
            navigate(destinoOriginal ? `${destinoOriginal.pathname}${destinoOriginal.search}` : '/admin', { replace: true });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setCargando(false);
        }
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-gray-50 p-4">
            {/* Imagen de fondo */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('/walppaper.jpg')`,
                }}
            />

            {/* Capa de sombra/overlay */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Contenido del formulario */}
            <div className="relative z-10 w-full max-w-sm bg-white/50 backdrop-blur-sm p-6 sm:p-8 rounded-lg shadow-lg border border-white/20">
                <div className='w-full flex flex-col justify-center items-center'>
                    <img className='w-40' src="/iconIQ.png" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel administrativo</h1>
                </div>

                <form onSubmit={manejarLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <input
                            type="text"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            required
                            autoFocus
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/90"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/90"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full bg-[#178236] text-white rounded-md py-2 text-sm font-medium hover:bg-[#0b9232] disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        Iniciar sesión
                    </button>
                </form>
            </div>
        </div>
    );
}
