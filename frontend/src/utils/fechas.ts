const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function parsearFechaISO(iso: string): Date {
    const [anio, mes, dia] = iso.split('-').map(Number);
    return new Date(Date.UTC(anio, mes - 1, dia));
}

export function formatearFecha(iso: string): string {
    const fecha = parsearFechaISO(iso);
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${fecha.getUTCFullYear()}`;
}

function sonAdyacentes(a: Date, b: Date): boolean {
    const diffDias = Math.round((b.getTime() - a.getTime()) / 86_400_000);
    if (diffDias === 1) return true;
    if (diffDias === 2) {
        const intermedia = new Date(a.getTime() + 86_400_000);
        return intermedia.getUTCDay() === 0; // puentea un domingo
    }
    return false;
}

function formatearRango(inicio: Date, fin: Date, anioActual: number): string {
    const sufijoAnio = (fecha: Date) => (fecha.getUTCFullYear() !== anioActual ? ` de ${fecha.getUTCFullYear()}` : '');

    if (inicio.getTime() === fin.getTime()) {
        return `${inicio.getUTCDate()} de ${MESES[inicio.getUTCMonth()]}${sufijoAnio(inicio)}`;
    }
    if (inicio.getUTCMonth() === fin.getUTCMonth() && inicio.getUTCFullYear() === fin.getUTCFullYear()) {
        return `del ${inicio.getUTCDate()} al ${fin.getUTCDate()} de ${MESES[fin.getUTCMonth()]}${sufijoAnio(fin)}`;
    }
    if (inicio.getUTCFullYear() === fin.getUTCFullYear()) {
        return `del ${inicio.getUTCDate()} de ${MESES[inicio.getUTCMonth()]} al ${fin.getUTCDate()} de ${MESES[fin.getUTCMonth()]}${sufijoAnio(fin)}`;
    }
    return `del ${inicio.getUTCDate()} de ${MESES[inicio.getUTCMonth()]} de ${inicio.getUTCFullYear()} al ${fin.getUTCDate()} de ${MESES[fin.getUTCMonth()]} de ${fin.getUTCFullYear()}`;
}

export const diasFinDeMes = (dias: string[]): string[] => {
    return dias.filter((iso) => Number(iso.slice(8, 10)) >= 29)
}

export function formatearDiasComoRangos(dias: string[]): string {
    if (dias.length === 0) return '';

    const anioActual = new Date().getUTCFullYear();
    const fechas = [...new Set(dias)].sort().map(parsearFechaISO);

    const grupos: Date[][] = [];
    let grupoActual: Date[] = [fechas[0]];
    for (let i = 1; i < fechas.length; i++) {
        if (sonAdyacentes(fechas[i - 1], fechas[i])) {
            grupoActual.push(fechas[i]);
        } else {
            grupos.push(grupoActual);
            grupoActual = [fechas[i]];
        }
    }
    grupos.push(grupoActual);

    const resultado = grupos
        .map((grupo) => formatearRango(grupo[0], grupo[grupo.length - 1], anioActual))
        .join(', ');

    return resultado.charAt(0).toUpperCase() + resultado.slice(1);
}