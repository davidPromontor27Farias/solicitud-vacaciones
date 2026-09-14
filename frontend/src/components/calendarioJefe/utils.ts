import type { EmpleadoEquipo } from '../../api/jefe';

export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function fechaISO(fecha: Date): string {
    return fecha.toISOString().slice(0, 10);
}

export function hoyISO(): string {
    const ahora = new Date();
    return fechaISO(new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())));
}

export function obtenerMatrizMes(anio: number, mes: number): Date[][] {
    const primerDia = new Date(Date.UTC(anio, mes, 1));
    const ultimoDia = new Date(Date.UTC(anio, mes + 1, 0));
    const offsetInicio = (primerDia.getUTCDay() + 6) % 7; // lunes = 0

    const dias: Date[] = [];
    for (let i = offsetInicio; i > 0; i--) {
        dias.push(new Date(Date.UTC(anio, mes, 1 - i)));
    }
    for (let d = 1; d <= ultimoDia.getUTCDate(); d++) {
        dias.push(new Date(Date.UTC(anio, mes, d)));
    }
    while (dias.length % 7 !== 0) {
        const ultimo = dias[dias.length - 1];
        dias.push(new Date(Date.UTC(ultimo.getUTCFullYear(), ultimo.getUTCMonth(), ultimo.getUTCDate() + 1)));
    }

    const semanas: Date[][] = [];
    for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
    return semanas;
}

export interface CriticoResumen {
    empleadoId: string;
    nombre: string;
    estado: 'vencido' | 'critico';
    diasPendientes: number;
    diasParaVencer: number;
    fechaLimiteDisfrute: string;
}

export function calcularCriticos(equipo: EmpleadoEquipo[]): CriticoResumen[] {
    const resultado: CriticoResumen[] = [];
    for (const empleado of equipo) {
        const urgente = empleado.saldos.find((s) => s.estado === 'vencido') ?? empleado.saldos.find((s) => s.estado === 'critico');
        if (!urgente) continue;
        resultado.push({
            empleadoId: empleado.empleadoId,
            nombre: empleado.nombre,
            estado: urgente.estado as 'vencido' | 'critico',
            diasPendientes: urgente.diasPendientes,
            diasParaVencer: urgente.diasParaVencer,
            fechaLimiteDisfrute: urgente.fechaLimiteDisfrute,
        });
    }
    return resultado.sort((a, b) => {
        if (a.estado !== b.estado) return a.estado === 'vencido' ? -1 : 1;
        return a.diasParaVencer - b.diasParaVencer;
    });
}

