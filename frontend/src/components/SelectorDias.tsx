import { useState } from 'react';

interface SelectorDiasProps {
    seleccionados: string[];
    onChange: (dias: string[]) => void;
}

const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatearFecha(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
}

function inicioDelDia(fecha: Date): Date {
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

// Politica de vacaciones: toda solicitud debe hacerse con un minimo de 5 dias de
// anticipacion, asi que ni hoy ni los proximos 4 dias se pueden seleccionar.
const DIAS_ANTICIPACION_MINIMA = 5;

export function SelectorDias({ seleccionados, onChange }: SelectorDiasProps) {
    const hoy = inicioDelDia(new Date());
    const primerDiaSeleccionable = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() + DIAS_ANTICIPACION_MINIMA));
    const [mesActual, setMesActual] = useState(() => new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1)));

    function puedeSeleccionar(fecha: Date): boolean {
        if (fecha < primerDiaSeleccionable) return false;
        if (fecha.getUTCDay() === 0) return false;
        return true;
    }

    function alternar(fecha: Date) {
        const clave = formatearFecha(fecha);
        if (seleccionados.includes(clave)) {
            onChange(seleccionados.filter((s) => s !== clave));
            return;
        }
        if (!puedeSeleccionar(fecha)) return;
        onChange([...seleccionados, clave].sort());
    }

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
                    const estaSeleccionado = seleccionados.includes(clave);
                    const habilitado = estaSeleccionado || puedeSeleccionar(fecha);

                    return (
                        <button
                            type="button"
                            key={i}
                            disabled={!habilitado}
                            onClick={() => alternar(fecha)}
                            className={[
                                'aspect-square rounded-md text-sm flex items-center justify-center',
                                estaSeleccionado
                                    ? 'bg-indigo-600 text-white font-medium'
                                    : habilitado
                                        ? 'text-gray-700 hover:bg-indigo-50'
                                        : 'text-gray-300 cursor-not-allowed',
                            ].join(' ')}
                        >
                            {fecha.getUTCDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
