import { ChevronLeft, Building2 } from 'lucide-react';
import { GLASS } from '../../utils/estilos';
import { TarjetaVacacionCritica } from './TarjetaVacacionCritica';
import { PaginacionControles } from './PaginacionControles';
import type { VacacionCritica } from '../../api/admin';

const TARJETAS_POR_PAGINA = 6;

export const VistaEmpleados = ({ departamento, items, pagina, onPaginaChange, onVolver, onSeleccionarEmpleado }: {
    departamento: string;
    items: VacacionCritica[];
    pagina: number;
    onPaginaChange: (pagina: number) => void;
    onVolver: () => void;
    onSeleccionarEmpleado: (empleadoId: string) => void;
}) => {
    const totalPaginas = Math.max(1, Math.ceil(items.length / TARJETAS_POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const inicio = (paginaActual - 1) * TARJETAS_POR_PAGINA;
    const visibles = items.slice(inicio, inicio + TARJETAS_POR_PAGINA);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onVolver}
                    className={`${GLASS} flex items-center gap-1.5 text-sm text-white/80 hover:bg-white/20 px-3 py-1.5 rounded-lg cursor-pointer`}
                >
                    <ChevronLeft size={16} />
                    Departamentos
                </button>
                <div className="flex items-center gap-2 min-w-0">
                    <Building2 size={16} className="text-white/50 shrink-0" />
                    <h2 className="text-base font-bold text-white truncate">{departamento}</h2>
                    <span className="text-xs font-medium text-white/70 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full shrink-0">{items.length}</span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibles.map((item) => (
                    <TarjetaVacacionCritica key={item.saldoId} item={item} onClick={() => onSeleccionarEmpleado(item.empleadoId)} />
                ))}
            </div>
            <PaginacionControles paginaActual={paginaActual} totalPaginas={totalPaginas} onPaginaChange={onPaginaChange} />
        </div>
    );
};
