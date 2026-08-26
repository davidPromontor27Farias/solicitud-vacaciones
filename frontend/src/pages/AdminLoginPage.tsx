import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, type Location } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useJefeAuth } from '../context/JefeAuthContext';
import { ApiError } from '../api/client';

type RolLogin = 'admin' | 'jefe';

export function AdminLoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { iniciarSesion: iniciarSesionAdmin } = useAdminAuth();
    const { iniciarSesion: iniciarSesionJefe } = useJefeAuth();
    // El "from" guardado en el state pudo haber quedado de un cierre de sesión del OTRO
    // rol (ej. el jefe se desloguea desde /panel-jefe y cae aquí con from=/panel-jefe).
    // Solo debe honrarse si es una ruta protegida del mismo rol con el que se va a iniciar
    // sesión ahora; si no, se ignora para evitar un loop de redirección hacia una ruta a
    // la que este rol no tiene acceso.
    const destinoOriginalCrudo = (location.state as { from?: Location } | null)?.from;

    const [rol, setRol] = useState<RolLogin>('admin');
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);

    function cambiarRol(nuevoRol: RolLogin) {
        setRol(nuevoRol);
        setUsuario('');
        setPassword('');
        setError(null);
    }

    async function manejarLogin(evento: FormEvent) {
        evento.preventDefault();
        setError(null);
        setCargando(true);
        try {
            if (rol === 'admin') {
                await iniciarSesionAdmin(usuario.trim(), password);
                const destino = destinoOriginalCrudo?.pathname.startsWith('/admin') ? destinoOriginalCrudo : null;
                navigate(destino ? `${destino.pathname}${destino.search}` : '/admin', { replace: true });
            } else {
                await iniciarSesionJefe(usuario.trim(), password);
                const destino = destinoOriginalCrudo?.pathname.startsWith('/panel-jefe') ? destinoOriginalCrudo : null;
                navigate(destino ? `${destino.pathname}${destino.search}` : '/panel-jefe', { replace: true });
            }
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

                <div className="flex gap-1.5 bg-white/60 border border-gray-200 rounded-lg p-1 mb-5">
                    <button
                        type="button"
                        onClick={() => cambiarRol('admin')}
                        className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors cursor-pointer ${
                            rol === 'admin' ? 'bg-[#178236] text-white' : 'text-gray-600 hover:bg-white/70'
                        }`}
                    >
                        Administrador
                    </button>
                    <button
                        type="button"
                        onClick={() => cambiarRol('jefe')}
                        className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors cursor-pointer ${
                            rol === 'jefe' ? 'bg-[#178236] text-white' : 'text-gray-600 hover:bg-white/70'
                        }`}
                    >
                        Jefe directo
                    </button>
                </div>

                <form onSubmit={manejarLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {rol === 'admin' ? 'Usuario' : 'Número de empleado'}
                        </label>
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
