import type { EmpleadoEquipo, EstadoSaldo } from '../../api/jefe';

export const ORDEN_URGENCIA: EstadoSaldo[] = ['vencido', 'critico', 'vigente'];

export const ESTILOS_ESTADO: Record<EstadoSaldo, { texto: string; punto: string; etiqueta: string; borde: string }> = {
    vencido: { texto: 'text-red-300', punto: 'bg-red-400', etiqueta: 'Vencido', borde: 'border-l-red-400' },
    critico: { texto: 'text-amber-300', punto: 'bg-amber-400', etiqueta: 'Por vencer', borde: 'border-l-amber-400' },
    vigente: { texto: 'text-emerald-300', punto: 'bg-emerald-400', etiqueta: 'Vigente', borde: 'border-l-emerald-400' },
};

export interface AgregadoEstado {
    dias: number;
    cantidad: number;
    fechaMasCercana: string | null;
}

export interface EmpleadoResumen {
    empleadoId: string;
    nombre: string;
    departamento: string;
    puesto: string | null;
    totalPeriodos: number;
    peorEstado: EstadoSaldo;
    porEstado: Record<EstadoSaldo, AgregadoEstado>;
}

export interface DepartamentoResumen {
    departamento: string;
    empleados: EmpleadoResumen[];
    porEstado: Record<EstadoSaldo, AgregadoEstado>;
}

export interface EmpleadoCercano {
    empleadoId: string;
    nombre: string;
    departamento: string;
    dias: number;
    estado: EstadoSaldo;
    fecha: string;
}

export const obtenerPeriodoCercano = (saldos: EmpleadoEquipo['saldos']) => {
    const hoyMs = Date.now();
    return [...saldos].sort((a, b) => {
        const da = Math.abs(new Date(`${a.fechaLimiteDisfrute}T00:00:00.000Z`).getTime() - hoyMs);
        const db = Math.abs(new Date(`${b.fechaLimiteDisfrute}T00:00:00.000Z`).getTime() - hoyMs);
        return da - db;
    })[0];
};

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

export function agregadoVacio(): Record<EstadoSaldo, AgregadoEstado> {
    return {
        vencido: { dias: 0, cantidad: 0, fechaMasCercana: null },
        critico: { dias: 0, cantidad: 0, fechaMasCercana: null },
        vigente: { dias: 0, cantidad: 0, fechaMasCercana: null },
    };
}

export function agruparPorEmpleado(equipo: EmpleadoEquipo[]): EmpleadoResumen[] {
    return equipo
        .filter((e) => e.saldos.length > 0)
        .map((empleado) => {
            const porEstado = agregadoVacio();
            for (const saldo of empleado.saldos) {
                const agregado = porEstado[saldo.estado];
                agregado.dias += saldo.diasPendientes;
                agregado.cantidad += 1;
                if (!agregado.fechaMasCercana || saldo.fechaLimiteDisfrute < agregado.fechaMasCercana) {
                    agregado.fechaMasCercana = saldo.fechaLimiteDisfrute;
                }
            }
            const peorEstado = ORDEN_URGENCIA.find((estado) => porEstado[estado].cantidad > 0) ?? 'vigente';
            return {
                empleadoId: empleado.empleadoId,
                nombre: empleado.nombre,
                departamento: empleado.departamento ?? 'Sin departamento',
                puesto: empleado.puesto,
                totalPeriodos: empleado.saldos.length,
                peorEstado,
                porEstado,
            };
        });
}

export function agruparPorDepartamento(empleados: EmpleadoResumen[]): DepartamentoResumen[] {
    const mapa = new Map<string, EmpleadoResumen[]>();
    for (const empleado of empleados) {
        const lista = mapa.get(empleado.departamento) ?? [];
        lista.push(empleado);
        mapa.set(empleado.departamento, lista);
    }
    return [...mapa.entries()].map(([departamento, empleadosDelDepto]) => {
        const porEstado = agregadoVacio();
        for (const empleado of empleadosDelDepto) {
            for (const estado of ORDEN_URGENCIA) {
                porEstado[estado].dias += empleado.porEstado[estado].dias;
                porEstado[estado].cantidad += empleado.porEstado[estado].cantidad;
            }
        }
        return { departamento, empleados: empleadosDelDepto, porEstado };
    });
}

// Solo interesan los departamentos con gente vencida o por vencer; los que solo
// tienen periodos vigentes no aportan nada a esta vista y se excluyen.
export function departamentosConRiesgo(departamentos: DepartamentoResumen[]): DepartamentoResumen[] {
    return departamentos
        .filter((d) => d.porEstado.vencido.cantidad > 0 || d.porEstado.critico.cantidad > 0)
        .sort((a, b) => {
            if (b.porEstado.vencido.dias !== a.porEstado.vencido.dias) return b.porEstado.vencido.dias - a.porEstado.vencido.dias;
            return b.porEstado.critico.dias - a.porEstado.critico.dias;
        });
}