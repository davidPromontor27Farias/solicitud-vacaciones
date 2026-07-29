import { MESES } from './CalendarioColisiones';

interface PanelEquipoMesProps {
    mesActual: Date;
    diasEquipoAprobados: Record<string, string[]>;
    diasEquipoPendientes: Record<string, string[]>;
}

interface RangoPersona {
    nombre: string;
    inicio: Date;
    fin: Date;
}

const UN_DIA_MS = 24 * 60 * 60 * 1000;

function agruparPorPersona(dias: Record<string, string[]>, anio: number, mes: number): RangoPersona[] {
    const fechasPorNombre = new Map<string, Date[]>();

    for (const [clave, nombres] of Object.entries(dias)) {
        const fecha = new Date(`${clave}T00:00:00.000Z`);
        if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes) continue;

        for (const nombre of nombres) {
            const lista = fechasPorNombre.get(nombre) ?? [];
            lista.push(fecha);
            fechasPorNombre.set(nombre, lista);
        }
    }

    const rangos: RangoPersona[] = [];
    for (const [nombre, fechas] of fechasPorNombre) {
        const ordenadas = [...fechas].sort((a, b) => a.getTime() - b.getTime());

        let inicio = ordenadas[0];
        let anterior = ordenadas[0];
        for (let i = 1; i <= ordenadas.length; i++) {
            const actual = ordenadas[i];
            const esConsecutivo = actual && actual.getTime() - anterior.getTime() === UN_DIA_MS;
            if (!esConsecutivo) {
                rangos.push({ nombre, inicio, fin: anterior });
                if (actual) inicio = actual;
            }
            if (actual) anterior = actual;
        }
    }

    return rangos.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}

function formatearRango(rango: RangoPersona): string {
    const mes = MESES[rango.inicio.getUTCMonth()].toLowerCase();
    const anio = rango.inicio.getUTCFullYear();

    if (rango.inicio.getTime() === rango.fin.getTime()) {
        return `${rango.inicio.getUTCDate()} de ${mes} de ${anio}`;
    }
    return `${rango.inicio.getUTCDate()} al ${rango.fin.getUTCDate()} de ${mes} de ${anio}`;
}

function ListaRangos({ rangos, colores }: { rangos: RangoPersona[]; colores: { fondo: string; borde: string; nombre: string; fecha: string } }) {
    return (
        <div className="space-y-2">
            {rangos.map((rango, i) => (
                <div key={i} className={`rounded-md px-2.5 py-2 ${colores.fondo} border ${colores.borde}`}>
                    <p className={`text-xs font-semibold leading-snug ${colores.nombre}`}>{rango.nombre}</p>
                    <p className={`text-[11px] leading-snug mt-0.5 ${colores.fecha}`}>{formatearRango(rango)}</p>
                </div>
            ))}
        </div>
    );
}

export function PanelEquipoMes({ mesActual, diasEquipoAprobados, diasEquipoPendientes }: PanelEquipoMesProps) {
    const rangosAprobados = agruparPorPersona(diasEquipoAprobados, mesActual.getUTCFullYear(), mesActual.getUTCMonth());
    const rangosPendientes = agruparPorPersona(diasEquipoPendientes, mesActual.getUTCFullYear(), mesActual.getUTCMonth());

    if (rangosAprobados.length === 0 && rangosPendientes.length === 0) {
        return null;
    }

    return (
        <div className="w-full sm:w-60 shrink-0 border border-gray-300 rounded-lg p-4 bg-white shadow-md sm:max-h-[28rem] overflow-y-auto">
            <p className="text-xs font-semibold text-gray-500 mb-3 pb-2 border-b border-gray-100">Equipo — {MESES[mesActual.getUTCMonth()]} {mesActual.getUTCFullYear()}</p>

            {rangosAprobados.length > 0 && (
                <div className="mb-4">
                    <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-2">Aprobado</p>
                    <ListaRangos
                        rangos={rangosAprobados}
                        colores={{ fondo: 'bg-amber-50', borde: 'border-amber-100', nombre: 'text-amber-900', fecha: 'text-amber-700' }}
                    />
                </div>
            )}

            {rangosPendientes.length > 0 && (
                <div>
                    <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-2">Pendiente</p>
                    <ListaRangos
                        rangos={rangosPendientes}
                        colores={{ fondo: 'bg-blue-50', borde: 'border-blue-100', nombre: 'text-blue-900', fecha: 'text-blue-700' }}
                    />
                </div>
            )}
        </div>
    );
}
