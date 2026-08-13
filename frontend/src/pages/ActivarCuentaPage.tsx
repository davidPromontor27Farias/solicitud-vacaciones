import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { registrarCorreo, crearPassword } from '../api/auth';
import { ApiError } from '../api/client';
import { PasswordInput } from '../components/PasswordInput';

export function ActivarCuentaPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const numeroEmpleado = searchParams.get('numeroEmpleado') ?? '';

    const [correo, setCorreo] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
    const [paso, setPaso] = useState<'correo' | 'token'>('correo');
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState<string | null>(null);

    async function manejarCorreo(evento: FormEvent) {
        evento.preventDefault();
        setError(null);
        setCargando(true);
        try {
            await registrarCorreo(numeroEmpleado, correo.trim());
            setMensaje('Te enviamos un correo con un código de activación. Si no te llega, pide el código a sistemas.');
            setPaso('token');
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setCargando(false);
        }
    }

    async function manejarToken(evento: FormEvent) {
        evento.preventDefault();
        setError(null);

        if (password !== passwordConfirmacion) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setCargando(true);
        try {
            await crearPassword(numeroEmpleado, token.trim(), password);
            navigate('/login', {
                state: { mensajeExito: 'Tu cuenta se creó correctamente. Inicia sesión con tu nueva contraseña.' },
            });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setCargando(false);
        }
    }

    if (!numeroEmpleado) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-sm text-gray-600">
                    Falta el número de empleado. <Link to="/login" className="text-indigo-600">Volver al login</Link>
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-gray-50">

            {/* Imagen de fondo */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('/walppaper.jpg')`, // Reemplaza 'tu-imagen.jpg' con el nombre de tu archivo
                }}
            />

            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 w-full max-w-sm bg-white/50 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/20">
                <div className='w-full flex flex-col justify-center items-center mb-10'>
                    <img  className='w-40' src="/iconIQ.png"/>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Activa tu cuenta</h1>
                </div>

                {paso === 'correo' ? (
                    <form onSubmit={manejarCorreo} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo personal:</label>
                            <input
                                type="email"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                required
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button
                            type="submit"
                            disabled={cargando}
                            className="w-full bg-[#178236] text-white rounded-md py-2 text-sm font-medium hover:bg-[#0b9232] disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            Enviar enlace de activación
                        </button>
                    </form>
                ) : (
                    <form onSubmit={manejarToken} className="space-y-4">
                        {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código de activación</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                value={token}
                                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                placeholder="123456"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                            <PasswordInput
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                            <PasswordInput
                                value={passwordConfirmacion}
                                onChange={(e) => setPasswordConfirmacion(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button
                            type="submit"
                            disabled={cargando}
                            className="w-full bg-green-700 text-white rounded-md py-2 text-sm font-medium hover:bg-green-900  cursor-pointer disabled:opacity-50"
                        >
                            Crear contraseña
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}