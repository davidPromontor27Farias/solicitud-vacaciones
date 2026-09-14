import type { EmpleadoEquipo, EstadoSaldo } from '../../api/jefe';

export type FiltroSemaforo = 'todos' | EstadoSaldo;

export interface EmpleadoConPeriodos {
    empleadoId: string;
    nombre: string;
    ordenFecha: string;
    periodos: EmpleadoEquipo['saldos'];
}

export function formatearFecha(iso: string): string {
    return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    });
}

export function iniciales(nombre: string): string {
    return nombre
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join('')
        .toUpperCase();
}

// De todos los periodos de un empleado, el que este mas cerca de hoy (sin importar si
// ya vencio o esta por vencer), para ordenar a los empleados por urgencia.
export function fechaMasCercana(saldos: EmpleadoEquipo['saldos']): string {
    const hoyMs = Date.now();
    return [...saldos].sort((a, b) => {
        const da = Math.abs(new Date(`${a.fechaLimiteDisfrute}T00:00:00.000Z`).getTime() - hoyMs);
        const db = Math.abs(new Date(`${b.fechaLimiteDisfrute}T00:00:00.000Z`).getTime() - hoyMs);
        return da - db;
    })[0].fechaLimiteDisfrute;
}

export function construirEmpleadosConPeriodos(equipo: EmpleadoEquipo[]): EmpleadoConPeriodos[] {
    return equipo
        .filter((empleado) => empleado.saldos.length > 0)
        .map((empleado) => ({
            empleadoId: empleado.empleadoId,
            nombre: empleado.nombre,
            ordenFecha: fechaMasCercana(empleado.saldos),
            periodos: [...empleado.saldos].sort((a, b) => a.fechaLimiteDisfrute.localeCompare(b.fechaLimiteDisfrute)),
        }))
        .sort((a, b) => a.ordenFecha.localeCompare(b.ordenFecha));
}

export interface FilaEquipo {
    empleadoId: string;
    nombre: string;
    total: number;
    tomados: number;
    disponibles: number;
    vencidos: number;
    porVencer: number;
    fechaVencimiento: string;
}

// Un empleado puede tener varios periodos de saldo (ej. contingentes de distintos años);
// se consolidan en una sola fila sumando cada periodo. "Fecha vencimiento" siempre muestra
// un dato: la fecha limite del periodo mas cercano a hoy (mismo criterio que ordenFecha),
// sin importar si ese periodo esta vencido, por vencer o vigente.
export function construirFilaEquipo(empleado: EmpleadoConPeriodos): FilaEquipo {
    const periodos = empleado.periodos;
    const total = periodos.reduce((acc, p) => acc + p.diasPorLey, 0);
    const tomados = periodos.reduce((acc, p) => acc + p.diasDisfrutados, 0);
    const disponibles = periodos.reduce((acc, p) => acc + p.diasPendientes, 0);
    const vencidos = periodos.filter((p) => p.estado === 'vencido').reduce((acc, p) => acc + p.diasPendientes, 0);
    const porVencer = periodos.filter((p) => p.estado === 'critico').reduce((acc, p) => acc + p.diasPendientes, 0);

    return {
        empleadoId: empleado.empleadoId,
        nombre: empleado.nombre,
        total, tomados, disponibles, vencidos, porVencer,
        fechaVencimiento: empleado.ordenFecha,
    };
}
