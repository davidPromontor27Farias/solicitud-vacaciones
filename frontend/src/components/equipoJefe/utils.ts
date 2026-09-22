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
    fechaVencido: string | null;
    porVencer: number;
    fechaPorVencer: string | null;
    otrosDisponibles: number;
    fechaProximaLimite: string | null;
    programados: number;
}

// La fecha mas urgente dentro de un grupo de periodos: la mas antigua si ya vencieron
// (la que lleva mas tiempo vencida), o la mas proxima si todavia estan por vencer.
function fechaMasUrgente(periodos: EmpleadoEquipo['saldos']): string | null {
    if (periodos.length === 0) return null;
    return periodos.reduce(
        (masUrgente, p) => (p.fechaLimiteDisfrute < masUrgente ? p.fechaLimiteDisfrute : masUrgente),
        periodos[0].fechaLimiteDisfrute,
    );
}

// Un empleado puede tener varios periodos de saldo (ej. contingentes de distintos años);
// se consolidan en una sola fila sumando cada periodo. Cada columna de dias (disponibles,
// por vencer, vencidos) es mutuamente excluyente con las otras dos (un periodo solo puede
// estar en un estado a la vez) y trae junto su propia fecha limite — por eso nunca deberian
// coincidir salvo casualidad real en los datos. La fecha solo se muestra si esa columna
// tiene dias (> 0); si no, no tiene caso mostrar una fecha y queda en "—".
export function construirFilaEquipo(empleado: EmpleadoConPeriodos): FilaEquipo {
    const periodos = empleado.periodos;
    const total = periodos.reduce((acc, p) => acc + p.diasPorLey, 0);
    const tomados = periodos.reduce((acc, p) => acc + p.diasDisfrutados, 0);

    // "Disponibles" = todo lo que no esta vencido (vigente + por vencer). "Otros disponibles"
    // es el restante una vez separados los que estan por vencer: la parte que todavia no
    // entra en la ventana critica de 6 meses, con su propia fecha limite (Proxima fecha limite).
    const periodosVigentes = periodos.filter((p) => p.estado === 'vigente');
    const periodosVencidos = periodos.filter((p) => p.estado === 'vencido');
    const periodosPorVencer = periodos.filter((p) => p.estado === 'critico');

    const disponibles = periodosVigentes.reduce((acc, p) => acc + p.diasPendientes, 0)
        + periodosPorVencer.reduce((acc, p) => acc + p.diasPendientes, 0);
    const vencidos = periodosVencidos.reduce((acc, p) => acc + p.diasPendientes, 0);
    const porVencer = periodosPorVencer.reduce((acc, p) => acc + p.diasPendientes, 0);
    const otrosDisponibles = disponibles - porVencer;
    const programados = periodosPorVencer.reduce((acc, p) => acc + p.diasProgramados, 0);

    return {
        empleadoId: empleado.empleadoId,
        nombre: empleado.nombre,
        total, tomados,
        disponibles,
        porVencer, fechaPorVencer: porVencer > 0 ? fechaMasUrgente(periodosPorVencer) : null,
        otrosDisponibles, fechaProximaLimite: otrosDisponibles > 0 ? fechaMasUrgente(periodosVigentes) : null,
        vencidos, fechaVencido: vencidos > 0 ? fechaMasUrgente(periodosVencidos) : null,
        programados,
    };
}
