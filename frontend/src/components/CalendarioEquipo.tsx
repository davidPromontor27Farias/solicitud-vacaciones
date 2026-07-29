import { useMemo, useState } from 'react';
import type { SolicitudEquipo } from '../api/solicitudes';
import { formatearDiasComoRangos } from '../utils/fechas';

interface CalendarioEquipoProps {
    solicitudes: SolicitudEquipo[];
}

const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MESES_CORTOS = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

// Paleta categórica validada (8 familias, orden fijo — nunca se ciclan al azar).
const PALETA_EQUIPO = [
    '#2a78d6', // azul
    '#1baf7a', // aqua
    '#eda100', // amarillo
    '#008300', // verde
    '#4a3aa7', // violeta
    '#e34948', // rojo
    '#e87ba4', // magenta
    '#eb6834', // naranja
];

function formatearFecha(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
}

function conAlfa(hex: string, alfa: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}

function fondoDegradado(colores: string[], alfa: number): string {
    const paso = 100 / colores.length;
    const paradas = colores.map((color, i) => {
        const tono = conAlfa(color, alfa);
        return `${tono} ${(i * paso).toFixed(2)}%, ${tono} ${((i + 1) * paso).toFixed(2)}%`;
    });
    return `linear-gradient(135deg, ${paradas.join(', ')})`;
}

function formatearDiaCorto(iso: string): string {
    const [, mes, dia] = iso.split('-').map(Number);
    return `${dia} ${MESES_CORTOS[mes - 1]}`;
}

export function CalendarioEquipo({ solicitudes }: CalendarioEquipoProps) {
    const hoy = new Date();
    const [mesActual, setMesActual] = useState(() => new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1)));

    // Orden estable (alfabético) para que cada persona conserve siempre el mismo color.
    const empleados = useMemo(() => {
        const nombres = new Set<string>();
        for (const s of solicitudes) nombres.add(s.empleadoNombre ?? 'Sin nombre');
        return [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
    }, [solicitudes]);

    const colorPorEmpleado = useMemo(() => {
        const mapa = new Map<string, string>();
        empleados.forEach((nombre, i) => mapa.set(nombre, PALETA_EQUIPO[i % PALETA_EQUIPO.length]));
        return mapa;
    }, [empleados]);

    const personasPorDia = useMemo(() => {
        const mapa = new Map<string, string[]>();
        for (const s of solicitudes) {
            const nombre = s.empleadoNombre ?? 'Sin nombre';
            for (const dia of s.dias) {
                const lista = mapa.get(dia) ?? [];
                lista.push(nombre);
                mapa.set(dia, lista);
            }
        }
        return mapa;
    }, [solicitudes]);

    const inicioMesClave = formatearFecha(new Date(Date.UTC(mesActual.getUTCFullYear(), mesActual.getUTCMonth(), 1)));
    const finMesClave = formatearFecha(new Date(Date.UTC(mesActual.getUTCFullYear(), mesActual.getUTCMonth() + 1, 0)));

    // Solo los días que caen dentro del mes que se está viendo — la lista cambia al navegar el calendario.
    const diasPorEmpleado = useMemo(() => {
        const mapa = new Map<string, string[]>();
        for (const s of solicitudes) {
            const nombre = s.empleadoNombre ?? 'Sin nombre';
            const diasEnMes = s.dias.filter((dia) => dia >= inicioMesClave && dia <= finMesClave);
            if (diasEnMes.length === 0) continue;
            const lista = mapa.get(nombre) ?? [];
            lista.push(...diasEnMes);
            mapa.set(nombre, lista);
        }
        return mapa;
    }, [solicitudes, inicioMesClave, finMesClave]);

    const cruces = useMemo(() => {
        return [...personasPorDia.entries()]
            .filter(([dia, personas]) => personas.length > 1 && dia >= inicioMesClave && dia <= finMesClave)
            .sort(([a], [b]) => a.localeCompare(b));
    }, [personasPorDia, inicioMesClave, finMesClave]);

    const diasEnMes = new Date(Date.UTC(mesActual.getUTCFullYear(), mesActual.getUTCMonth() + 1, 0)).getUTCDate();
    const offsetInicio = mesActual.getUTCDay();

    const celdas: (Date | null)[] = [];
    for (let i = 0; i < offsetInicio; i++) celdas.push(null);
    for (let dia = 1; dia <= diasEnMes; dia++) {
        celdas.push(new Date(Date.UTC(mesActual.getUTCFullYear(), mesActual.getUTCMonth(), dia)));
    }

    return (
        <div className="space-y-6">

        <div className="flex flex-col lg:flex-row gap-8">
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
                        const personas = personasPorDia.get(clave) ?? [];
                        const visibles = personas.slice(0, 4);
                        const coloresVisibles = visibles.map((nombre) => colorPorEmpleado.get(nombre) ?? '#898781');
                        const enCruce = personas.length > 1;

                        let estiloFondo: React.CSSProperties | undefined;
                        if (personas.length === 1) {
                            estiloFondo = {
                                backgroundColor: conAlfa(coloresVisibles[0], 0.12),
                                boxShadow: `inset 0 0 0 1px ${conAlfa(coloresVisibles[0], 0.35)}`,
                            };
                        } else if (enCruce) {
                            estiloFondo = {
                                backgroundImage: fondoDegradado(coloresVisibles, 0.22),
                                boxShadow: `inset 0 0 0 1px ${conAlfa(coloresVisibles[0], 0.4)}`,
                            };
                        }

                        return (
                            <div
                                key={i}
                                title={personas.join(', ')}
                                className="aspect-square rounded-md text-sm flex flex-col items-center justify-center gap-0.5"
                                style={estiloFondo}
                            >
                                <span className="text-gray-900 leading-none font-medium">{fecha.getUTCDate()}</span>
                                {personas.length > 0 && (
                                    <span className="flex items-center gap-[3px] h-1.5">
                                        {visibles.map((nombre, idx) => (
                                            <span
                                                key={idx}
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ backgroundColor: colorPorEmpleado.get(nombre) }}
                                            />
                                        ))}
                                        {personas.length > visibles.length && (
                                            <span className="text-[9px] leading-none text-gray-500 font-medium">
                                                +{personas.length - visibles.length}
                                            </span>
                                        )}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
                <p className="text-xs text-gray-400 mt-3">Pasa el cursor sobre un día para ver quién está de vacaciones.</p>
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Vacaciones del equipo · {MESES[mesActual.getUTCMonth()]} {mesActual.getUTCFullYear()}
                </h3>
                {diasPorEmpleado.size === 0 ? (
                    <p className="text-sm text-gray-500">Nadie de tu equipo tiene vacaciones aprobadas en este mes.</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {[...diasPorEmpleado.entries()].map(([nombre, dias]) => (
                            <li key={nombre} className="py-2.5 flex items-start gap-3">
                                <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                                    style={{
                                        backgroundColor: colorPorEmpleado.get(nombre),
                                        boxShadow: `0 0 0 2px ${conAlfa(colorPorEmpleado.get(nombre) ?? '#000000', 0.18)}`,
                                    }}
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{nombre}</p>
                                    <p className="text-sm text-gray-500">{formatearDiasComoRangos(dias)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>

        {cruces.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Días que se cruzan · {MESES[mesActual.getUTCMonth()]} {mesActual.getUTCFullYear()}
                </h3>
                <p className="text-xs text-gray-500 mb-3">Estos días coinciden dos o más personas de vacaciones a la vez.</p>
                <ul className="space-y-2">
                    {cruces.map(([dia, personas]) => (
                        <li key={dia} className="flex items-start gap-3 text-sm">
                            <span className="text-gray-500 shrink-0 w-16">{formatearDiaCorto(dia)}</span>
                            <span className="flex flex-wrap gap-x-3 gap-y-1">
                                {personas.map((nombre, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1.5 text-gray-900">
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: colorPorEmpleado.get(nombre) }}
                                        />
                                        {nombre}
                                    </span>
                                ))}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
        </div>
    );
}
