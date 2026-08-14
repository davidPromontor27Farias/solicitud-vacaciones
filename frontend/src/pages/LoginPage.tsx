import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link, type Location } from 'react-router-dom';
import { verificarNumeroEmpleado } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { iniciarSesion } = useAuth();
    const destinoOriginal = (location.state as { from?: Location } | null)?.from;
    const mensajeExito = (location.state as { mensajeExito?: string } | null)?.mensajeExito;

    const [numeroEmpleado, setNumeroEmpleado] = useState('');
    const [password, setPassword] = useState('');
    const [paso, setPaso] = useState<'numero' | 'password'>('numero');
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);

    async function manejarNumero(evento: FormEvent) {
        evento.preventDefault();
        setError(null);
        setCargando(true);
        try {
            const resultado = await verificarNumeroEmpleado(numeroEmpleado.trim());
            if (!resultado.existe) {
                setError('No encontramos ese número de empleado');
                return;
            }
            if (resultado.requierePrimerAcceso) {
                navigate(`/activar?numeroEmpleado=${encodeURIComponent(numeroEmpleado.trim())}`);
                return;
            }
            setPaso('password');
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setCargando(false);
        }
    }

    async function manejarLogin(evento: FormEvent) {
        evento.preventDefault();
        setError(null);
        setCargando(true);
        try {
            await iniciarSesion(numeroEmpleado.trim(), password);
            if (destinoOriginal) {
                navigate(`${destinoOriginal.pathname}${destinoOriginal.search}`, { replace: true });
            } else {
                navigate('/');
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
                    backgroundImage: `url('/walppaper.jpg')`, // Reemplaza 'tu-imagen.jpg' con el nombre de tu archivo
                }}
            />

            {/* Capa de sombra/overlay */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Accesos de administración */}
            <div className="absolute top-4 right-4 z-20 text-right font-bold">
                <Link
                    to="/admin/login"
                >
                    Admin
                </Link>
            </div>

            {/* Contenido del formulario */}
            <div className="relative z-10 w-full max-w-sm bg-white/50 backdrop-blur-sm p-6 sm:p-8 rounded-lg shadow-lg border border-white/20">
                <div className='w-full flex flex-col justify-center items-center'>
                    <img  className='w-40' src="/iconIQ.png"/>
                    <h1 className="text-2xl font-bold text-gray-900 mb-6 ">Solicitud de Vacaciones</h1>
                </div>

                {mensajeExito && (
                    <p className="mb-4 text-sm text-center text-green-700 bg-green-50 border border-green-200 rounded-md py-2 px-3">
                        {mensajeExito}
                    </p>
                )}

                {paso === 'numero' ? (
                    <form onSubmit={manejarNumero} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número de empleado</label>
                            <input
                                type="text"
                                value={numeroEmpleado}
                                onChange={(e) => setNumeroEmpleado(e.target.value)}
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
                            Continuar
                        </button>
                    </form>
                ) : (
                    <form onSubmit={manejarLogin} className="space-y-4">
                        <p className="text-sm text-gray-500">Empleado {numeroEmpleado}</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoFocus
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
                        <button
                            type="button"
                            onClick={() => setPaso('numero')}
                            className="w-full text-sm text-gray-500 hover:text-gray-700"
                        >
                            Cambiar número de empleado
                        </button>
                        <Link
                            to={`/recuperar?numeroEmpleado=${encodeURIComponent(numeroEmpleado)}`}
                            className="block text-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </form>
                )}
            </div>
        </div>
    );
}