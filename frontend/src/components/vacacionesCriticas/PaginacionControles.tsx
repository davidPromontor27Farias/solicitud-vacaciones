

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GLASS } from '../../utils/estilos';

export const PaginacionControles = ({ paginaActual, totalPaginas, onPaginaChange }: { paginaActual: number; totalPaginas: number; onPaginaChange: (pagina: number) => void }) => {
    if (totalPaginas <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-1.5 pt-1">
            <button
                type="button"
                onClick={() => onPaginaChange(paginaActual - 1)}
                disabled={paginaActual === 1}
                className={`${GLASS} p-1.5 rounded-lg text-white/70 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 cursor-pointer disabled:cursor-not-allowed`}
            >
                <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numero) => (
                <button
                    key={numero}
                    type="button"
                    onClick={() => onPaginaChange(numero)}
                    className={`min-w-[2rem] px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        numero === paginaActual
                            ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow'
                            : `${GLASS} text-white/70 hover:bg-white/20`
                    }`}
                >
                    {numero}
                </button>
            ))}
            <button
                type="button"
                onClick={() => onPaginaChange(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className={`${GLASS} p-1.5 rounded-lg text-white/70 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 cursor-pointer disabled:cursor-not-allowed`}
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
};
