import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useJefeAuth } from '../context/JefeAuthContext';
import { LogOut, ChevronLeft, ChevronRight, Users, CalendarDays, Building2 } from 'lucide-react';

export function JefeLayout() {
    const { jefe, cerrarSesion } = useJefeAuth();
    const [colapsado, setColapsado] = useState(false);

    return (
        <div className="min-h-screen relative bg-gray-50">

            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('/walppaper.jpg')`,
                }}
            />
            <div className="absolute inset-0 bg-black/50" />

            <div className="z-10 relative flex flex-col sm:flex-row">
                <aside
                    className={`relative ${colapsado ? 'sm:w-16' : 'sm:w-48'} shrink-0 bg-white border-b sm:border-b-0 sm:border-r border-gray-200 flex flex-col sm:h-screen sm:sticky sm:top-0 sm:self-start transition-[width] duration-200`}
                >
                    <button
                        type="button"
                        onClick={() => setColapsado((c) => !c)}
                        title={colapsado ? 'Mostrar barra' : 'Ocultar barra'}
                        className="hidden sm:flex absolute -right-3 top-6 w-6 h-6 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 shadow-sm cursor-pointer z-20"
                    >
                        {colapsado ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                    </button>

                    <div className="p-4 flex items-center gap-2.5">
                        <img className="w-9 shrink-0" src="/iconIQ.png" />
                        {!colapsado && (
                            <span className="text-gray-900 font-semibold text-sm leading-snug">
                                Panel del jefe
                            </span>
                        )}
                    </div>

                    <nav className="px-3 py-2 flex sm:flex-col gap-1">
                        <NavLink
                            to="/panel-jefe"
                            end
                            title="Mi equipo"
                            className={({ isActive }) =>
                                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isActive ? 'bg-[#4a8b2c]/10 text-[#4a8b2c]' : 'text-gray-600 hover:bg-gray-100'
                                }`
                            }
                        >
                            <Users className="w-4 h-4 shrink-0" />
                            {!colapsado && 'Mi equipo'}
                        </NavLink>
                        <NavLink
                            to="/panel-jefe/calendario"
                            title="Calendario"
                            className={({ isActive }) =>
                                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isActive ? 'bg-[#4a8b2c]/10 text-[#4a8b2c]' : 'text-gray-600 hover:bg-gray-100'
                                }`
                            }
                        >
                            <CalendarDays className="w-4 h-4 shrink-0" />
                            {!colapsado && 'Calendario'}
                        </NavLink>
                        {jefe?.accesoTotal && (
                            <NavLink
                                to="/panel-jefe/departamentos"
                                title="Todos los departamentos"
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive ? 'bg-[#4a8b2c]/10 text-[#4a8b2c]' : 'text-gray-600 hover:bg-gray-100'
                                    }`
                                }
                            >
                                <Building2 className="w-4 h-4 shrink-0" />
                                {!colapsado && 'Todos los departamentos'}
                            </NavLink>
                        )}
                        {jefe?.tieneMatricial && (
                            <NavLink
                                to="/panel-jefe/matricial"
                                title="Matricial"
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive ? 'bg-[#4a8b2c]/10 text-[#4a8b2c]' : 'text-gray-600 hover:bg-gray-100'
                                    }`
                                }
                            >
                                <Building2 className="w-4 h-4 shrink-0" />
                                {!colapsado && 'Matricial'}
                            </NavLink>
                        )}
                    </nav>

                    <div className="sm:mt-auto p-4 border-t border-gray-200 flex items-center justify-between gap-3 sm:flex-col sm:items-stretch">
                        {!colapsado && jefe && <span className="text-gray-500 text-xs truncate">{jefe.nombre}</span>}
                        <button
                            onClick={cerrarSesion}
                            title="Cerrar sesión"
                            className="flex items-center gap-1.5 text-red-600 hover:text-red-800 cursor-pointer text-xs shrink-0"
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            {!colapsado && 'Cerrar sesión'}
                        </button>
                    </div>
                </aside>

                <main className="flex-1 min-w-0 px-6 py-8">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

        </div>
    );
}
