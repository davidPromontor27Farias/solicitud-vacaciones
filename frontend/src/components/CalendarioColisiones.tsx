import type { CSSProperties } from 'react';

interface CalendarioColisionesProps {
    mesActual: Date;
    onMesActualChange: (mes: Date) => void;
    diasSolicitados: string[];
    diasEnColision: Set<string>;
    diasEquipoAprobados: Record<string, string[]>;
    diasEquipoPendientes: Record<string, string[]>;
}

export const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
export const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const COLOR_SOLICITADO = '#4a8b2c';
export const COLOR_COLISION = '#fca5a5';
export const COLOR_APROBADO = '#fde68a';
export const COLOR_PENDIENTE = '#bfdbfe';
const COLOR_PENDIENTE_SOLIDO = '#93c5fd';

function formatearFecha(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
}

function estiloCelda(params: {
    solicitado: boolean;
    enColision: boolean;
    aprobadoEquipo: boolean;
    pendienteEquipo: boolean;
}): { className: string; style?: CSSProperties } {
    const { solicitado, enColision, aprobadoEquipo, pendienteEquipo } = params;

    if (enColision) {
        return {
            className: 'text-red-900 font-semibold ring-1 ring-red-400',
            style: { background: `linear-gradient(135deg, ${COLOR_SOLICITADO} 50%, ${COLOR_COLISION} 50%)` },
        };
    }
    if (solicitado && pendienteEquipo) {
        return {
            className: 'text-blue-950 font-semibold ring-1 ring-blue-400',
            style: { background: `linear-gradient(135deg, ${COLOR_SOLICITADO} 50%, ${COLOR_PENDIENTE_SOLIDO} 50%)` },
        };
    }
    if (solicitado) {
        return { className: 'bg-[#4a8b2c] text-white font-medium' };
    }
    if (aprobadoEquipo && pendienteEquipo) {
        return {
            className: 'text-gray-900 font-medium',
            style: { background: `linear-gradient(135deg, ${COLOR_APROBADO} 50%, ${COLOR_PENDIENTE} 50%)` },
        };
    }
    if (aprobadoEquipo) {
        return { className: 'bg-amber-100 text-amber-700 font-medium' };
    }
    if (pendienteEquipo) {
        return { className: 'bg-blue-100 text-blue-700 font-medium' };
    }
    return { className: 'text-gray-700' };
}

export function CalendarioColisiones({
    mesActual,
    onMesActualChange,
    diasSolicitados,
    diasEnColision,
    diasEquipoAprobados,
    diasEquipoPendientes,
}: CalendarioColisionesProps) {
    const diasEquiposAprobadosSet = new Set(Object.keys(diasEquipoAprobados));
    const diasEquipoPendientesSet = new Set(Object.keys(diasEquipoPendientes));

    const diasEnMes = new Date(Date.UTC(mesActual.getUTCFullYear(), mesActual.getUTCMonth() + 1, 0)).getUTCDate();
    const offsetInicio = mesActual.getUTCDay();

    const celdas: (Date | null)[] = [];
    for (let i = 0; i < offsetInicio; i++) celdas.push(null);
    for (let dia = 1; dia <= diasEnMes; dia++) {
        celdas.push(new Date(Date.UTC(mesActual.getUTCFullYear(), mesActual.getUTCMonth(), dia)));
    }

    return (
        <div className="w-full sm:w-64">
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    onClick={() => onMesActualChange(new Date(Date.UTC(mesActual.getUTCFullYear(), mesActual.getUTCMonth() - 1, 1)))}
                    className="px-2 py-1 text-gray-500 hover:text-gray-800"
                >
                    ‹
                </button>
                <span className="text-sm font-medium text-gray-900">
                    {MESES[mesActual.getUTCMonth()]} {mesActual.getUTCFullYear()}
                </span>
                <button
                    type="button"
                    onClick={() => onMesActualChange(new Date(Date.UTC(mesActual.getUTCFullYear(), mesActual.getUTCMonth() + 1, 1)))}
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
                    const { className, style } = estiloCelda({
                        solicitado: diasSolicitados.includes(clave),
                        enColision: diasEnColision.has(clave),
                        aprobadoEquipo: diasEquiposAprobadosSet.has(clave),
                        pendienteEquipo: diasEquipoPendientesSet.has(clave),
                    });

                    return (
                        <div
                            key={i}
                            className={['aspect-square rounded-md text-sm flex items-center justify-center', className].join(' ')}
                            style={style}
                        >
                            {fecha.getUTCDate()}
                        </div>
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#4a8b2c] inline-block" /> Solicitado</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm ring-1 ring-red-400 inline-block" style={{ background: `linear-gradient(135deg, ${COLOR_SOLICITADO} 50%, ${COLOR_COLISION} 50%)` }} /> En colisión</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm ring-1 ring-blue-400 inline-block" style={{ background: `linear-gradient(135deg, ${COLOR_SOLICITADO} 50%, ${COLOR_PENDIENTE_SOLIDO} 50%)` }} /> Cruza con pendiente</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-100 inline-block" /> Aprobado</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-100 inline-block" /> Pendiente</span>
            </div>
        </div>
    );
}
