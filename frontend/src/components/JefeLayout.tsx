import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useJefeAuth } from '../context/JefeAuthContext';
import { NotificacionesJefe } from './NotificacionesJefe';
import { 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  CalendarDays, 
  Building2, 
  Menu, 
  X,
  UserCheck
} from 'lucide-react';

export function JefeLayout() {
  const { jefe, cerrarSesion } = useJefeAuth();
  const [colapsado, setColapsado] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen relative bg-gray-900 text-gray-100 overflow-x-hidden">
      {/* Fondo de Pantalla */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url('/walppaper.webp')` }}
      />
      <div className="fixed inset-0 bg-black/60 pointer-events-none" />

      {/* HEADER SUPERIOR (SOLO MÓVIL) */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-200/80 md:hidden shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMenuMovilAbierto(true)}
            className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 active:scale-95 transition-transform cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <img className="w-8 shrink-0" src="/iconIQ.png" alt="IQ Icon" />
          <span className="text-gray-900 font-bold text-sm tracking-tight">
            Panel del jefe
          </span>
        </div>

        <div className="flex items-center gap-2">
          <NotificacionesJefe />
        </div>
      </header>

      {/* DRAWER MENÚ DESPLEGABLE MÓVIL (ANIMADO CON FRAMER MOTION) */}
      <AnimatePresence>
        {menuMovilAbierto && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop con Fade Sutil */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMenuMovilAbierto(false)}
            />

            {/* Panel Deslizante Lateral con Ease Suave */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-4/5 max-w-xs bg-white text-gray-900 h-full flex flex-col shadow-2xl z-10 p-5 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <img className="w-8 shrink-0" src="/iconIQ.png" alt="IQ Icon" />
                  <span className="font-bold text-base text-gray-900">Panel del jefe</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuMovilAbierto(false)}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 active:scale-95 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Perfil del Jefe */}
              {jefe && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="p-2 bg-[#4a8b2c]/10 text-[#4a8b2c] rounded-lg">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400 font-medium">Sesión iniciada</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{jefe.nombre}</p>
                  </div>
                </div>
              )}

              {/* Links de Navegación en el Drawer */}
              <nav className="space-y-1.5 flex-1">
                <NavLink
                  to="/panel-jefe"
                  end
                  onClick={() => setMenuMovilAbierto(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      isActive ? 'bg-[#4a8b2c]/10 text-[#4a8b2c]' : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <Users className="w-5 h-5 shrink-0" />
                  Mi equipo
                </NavLink>

                <NavLink
                  to="/panel-jefe/calendario"
                  onClick={() => setMenuMovilAbierto(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      isActive ? 'bg-[#4a8b2c]/10 text-[#4a8b2c]' : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <CalendarDays className="w-5 h-5 shrink-0" />
                  Calendario
                </NavLink>

                {jefe?.accesoTotal && (
                  <NavLink
                    to="/panel-jefe/departamentos"
                    onClick={() => setMenuMovilAbierto(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        isActive ? 'bg-[#4a8b2c]/10 text-[#4a8b2c]' : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Building2 className="w-5 h-5 shrink-0" />
                    Todos los departamentos
                  </NavLink>
                )}

                {jefe?.tieneMatricial && (
                  <NavLink
                    to="/panel-jefe/matricial"
                    onClick={() => setMenuMovilAbierto(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        isActive ? 'bg-[#4a8b2c]/10 text-[#4a8b2c]' : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Building2 className="w-5 h-5 shrink-0" />
                    Matricial
                  </NavLink>
                )}
              </nav>

              {/* Botón Cerrar Sesión */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setMenuMovilAbierto(false);
                    cerrarSesion();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-semibold text-sm transition-colors active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ESTRUCTURA PRINCIPAL */}
      <div className="z-10 relative flex flex-col md:flex-row min-h-screen">
        {/* ASIDE / SIDEBAR (SOLO DESKTOP) */}
        <aside
          className={`hidden md:flex relative ${
            colapsado ? 'w-16' : 'w-52'
          } shrink-0 bg-white border-r border-gray-200 flex-col h-screen sticky top-0 self-start transition-[width] duration-300 ease-in-out shadow-md`}
        >
          {/* Botón Colapsar Sidebar */}
          <button
            type="button"
            onClick={() => setColapsado((c) => !c)}
            title={colapsado ? 'Expandir menú' : 'Colapsar menú'}
            className="absolute -right-3 top-6 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-800 shadow-sm cursor-pointer z-20 active:scale-95"
          >
            {colapsado ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Brand Logo */}
          <div className="p-4 flex items-center gap-2.5">
            <img className="w-8 shrink-0" src="/iconIQ.png" alt="IQ Icon" />
            {!colapsado && (
              <span className="text-gray-900 font-bold text-sm leading-snug truncate">
                Panel del jefe
              </span>
            )}
          </div>

          {/* Menú Navegación Escritorio */}
          <nav className="px-3 py-2 flex flex-col gap-1.5 flex-1">
            <NavLink
              to="/panel-jefe"
              end
              title="Mi equipo"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive ? 'bg-[#4a8b2c]/10 text-[#4a8b2c]' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Users className="w-4 h-4 shrink-0" />
              {!colapsado && <span className="truncate">Mi equipo</span>}
            </NavLink>

            <NavLink
              to="/panel-jefe/calendario"
              title="Calendario"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive ? 'bg-[#4a8b2c]/10 text-[#4a8b2c]' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              {!colapsado && <span className="truncate">Calendario</span>}
            </NavLink>

            {jefe?.accesoTotal && (
              <NavLink
                to="/panel-jefe/departamentos"
                title="Todos los departamentos"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? 'bg-[#4a8b2c]/10 text-[#4a8b2c]' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Building2 className="w-4 h-4 shrink-0" />
                {!colapsado && <span className="truncate">Departamentos</span>}
              </NavLink>
            )}

            {jefe?.tieneMatricial && (
              <NavLink
                to="/panel-jefe/matricial"
                title="Matricial"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? 'bg-[#4a8b2c]/10 text-[#4a8b2c]' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Building2 className="w-4 h-4 shrink-0" />
                {!colapsado && <span className="truncate">Matricial</span>}
              </NavLink>
            )}
          </nav>

          {/* Footer del Sidebar */}
          <div className="p-3 border-t border-gray-100 flex flex-col gap-2">
            {!colapsado && jefe && (
              <span className="text-gray-500 text-xs font-medium truncate px-1">{jefe.nombre}</span>
            )}
            <button
              type="button"
              onClick={cerrarSesion}
              title="Cerrar sesión"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!colapsado && 'Cerrar sesión'}
            </button>
          </div>
        </aside>

        {/* ÁREA DE CONTENIDO PRINCIPAL */}
        <main className="flex-1 min-w-0 px-3 sm:px-6 py-4 sm:py-8">
          <div className="max-w-screen-2xl mx-auto">
            {/* Header de notificaciones (Solo en Escritorio) */}
            <div className="hidden md:flex justify-end mb-4">
              <NotificacionesJefe />
            </div>

            {/* Transición Sutil de Aparición de Páginas */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}