import { User, Building2, Users, UserCheck, Mail } from 'lucide-react';
import type { PerfilEmpleado } from '../../api/empleados';

export const PerfilHeader = ({ perfil, cargando, error }: { perfil: PerfilEmpleado | null; cargando: boolean; error: string | null }) => {
    return (
        <section className="bg-gradient-to-right from-[#4a8b2c] to-[#ee7624] p-5 sm:p-8 rounded-2xl shadow-lg text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-full">
                <User className="w-12 h-12" />
                </div>
                {cargando ? (
                <p className="text-lg">Cargando perfil...</p>
                ) : error ? (
                <p className="text-lg text-red-200">{error}</p>
                ) : perfil && (
                <div>
                    <h2 className="text-2xl font-bold">{perfil.nombre}</h2>
                    <p className="text-white/80 text-sm">{perfil.puesto || 'Sin puesto'}</p>
                </div>
                )}
            </div>
            {perfil && (
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-sm opacity-80">#</span>
                <span className="font-mono font-bold">{perfil.numeroEmpleado}</span>
                </div>
            )}
            </div>

            {perfil && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 opacity-80" />
                <div>
                    <p className="text-xs opacity-80">Sociedad</p>
                    <p className="text-sm font-medium">{perfil.sociedad || '—'}</p>
                </div>
                </div>
                <div className="flex items-center gap-2">
                <Users className="w-4 h-4 opacity-80" />
                <div>
                    <p className="text-xs opacity-80">Departamento</p>
                    <p className="text-sm font-medium">{perfil.departamento || '—'}</p>
                </div>
                </div>
                <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 opacity-80" />
                <div>
                    <p className="text-xs opacity-80">Jefe directo</p>
                    <p className="text-sm font-medium">{perfil.jefeDirecto?.nombre || '—'}</p>
                </div>
                </div>
                <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 opacity-80" />
                <div className='min-w-0'>
                    <p className="text-xs opacity-80">Correo</p>
                    <p className="text-sm font-medium break-all sm:break-normal">{perfil.correoPersonal || '—'}</p>
                </div>
                </div>
            </div>
            )}
        </section>
    );
};