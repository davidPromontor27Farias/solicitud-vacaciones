import { useState } from 'react';

interface CalendarioColisionesProps {
    mesInicial: Date;
    diasSolicitados: string[];
    diasEnColision: Set<string>;
}

const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatearFecha(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
}

export function CalendarioColisiones({ mesInicial, diasSolicitados, diasEnColision }: CalendarioColisionesProps) {
    const [mesActual, setMesActual] = useState(() => new Date(Date.UTC(mesInicial.getUTCFullYear(), mesInicial.getUTCMonth(), 1)));

    const diasEnMes = new Date(Date.UTC(mesActual.getUTCFullYear(), mesActual.getUTCMonth() + 1, 0)).getUTCDate();
    const offsetInicio = mesActual.getUTCDay();

    const celdas: (Date | null)[] = [];
    for (let i = 0; i < offsetInicio; i++) celdas.push(null);
    for (let dia = 1; dia <= diasEnMes; dia++) {
        celdas.push(new Date(Date.UTC(mesActual.getUTCFullYear(), mesActual.getUTCMonth(), dia)));
    }

    return (
        <div className="w-full max-w-xs">
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    onClick={() => setMesActual(new Date(Date.UTC(mesActual.getUTCFullYear(), mesActual.getUTCMonth() - 1, 1)))}
                    className="px-2 py-1 text-gray-500 hover:text-gray-800"
                >
                    ‹
                </button>
                <span className="text-sm font-medium text-gray-900">
                    {MESES[mesActual.getUTCMonth()]} {mesActual.getUTCFullYear()}
                </span>
                <button
                    type="button"
                    onClick={() => setMesActual(new Date(Date.UTC(mesActual.getUTCFullYear(), mesActual.getUTCMonth() + 1, 1)))}
                    className="px-2 py-1 text-gray-500 hover:text-gray-800"
                >
                    ›
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
                {DIAS_SEMANA.map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {celdas.map((fecha, i) => {
                    if (!fecha) return <div key={i} />;
                    const clave = formatearFecha(fecha);
                    const solicitado = diasSolicitados.includes(clave);
                    const enColision = diasEnColision.has(clave);

                    return (
                        <div
                            key={i}
                            className={[
                                'aspect-square rounded-md text-sm flex items-center justify-center',
                                enColision
                                    ? 'bg-red-100 text-red-700 font-semibold ring-1 ring-red-400'
                                    : solicitado
                                        ? 'bg-indigo-600 text-white font-medium'
                                        : 'text-gray-700',
                            ].join(' ')}
                        >
                            {fecha.getUTCDate()}
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" /> Solicitado</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 ring-1 ring-red-400 inline-block" /> En colisión</span>
            </div>
        </div>
    );
}
