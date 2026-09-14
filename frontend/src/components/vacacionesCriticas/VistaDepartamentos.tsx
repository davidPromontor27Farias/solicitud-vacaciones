

import { TarjetaDepartamento } from './TarjetaDepartamento';
import { PaginacionControles } from './PaginacionControles';
import type { DepartamentoResumen } from './utils';

const TARJETAS_POR_PAGINA = 6;

export const VistaDepartamentos = ({ departamentos, esVencido, pagina, onPaginaChange, onSeleccionar }: {
    departamentos: DepartamentoResumen[];
    esVencido: boolean;
    pagina: number;
    onPaginaChange: (pagina: number) => void;
    onSeleccionar: (departamento: string) => void;
}) => {
    const totalPaginas = Math.max(1, Math.ceil(departamentos.length / TARJETAS_POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const inicio = (paginaActual - 1) * TARJETAS_POR_PAGINA;
    const visibles = departamentos.slice(inicio, inicio + TARJETAS_POR_PAGINA);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibles.map((resumen) => (
                    <TarjetaDepartamento
                        key={resumen.departamento}
                        resumen={resumen}
                        esVencido={esVencido}
                        onClick={() => onSeleccionar(resumen.departamento)}
                    />
                ))}
            </div>
            <PaginacionControles paginaActual={paginaActual} totalPaginas={totalPaginas} onPaginaChange={onPaginaChange} />
        </div>
    );
};