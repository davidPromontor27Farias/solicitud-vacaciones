import { apiFetch } from './client';

export interface PeriodoSaldo {
    diasPorLey: number;
    diasDisfrutados: number;
    diasPendientes: number;
    inicioValidez: string;
    finValidez: string;
    fechaVencimiento: string;
    fechaLimiteDisfrute: string;
}

export interface PerfilEmpleado {
    nombre: string;
    numeroEmpleado: string;
    sociedad: string | null;
    puesto: string | null;
    departamento: string | null;
    correoPersonal: string | null;
    jefeDirecto: { nombre: string } | null;
    esJefe: boolean;
    backupNombre: string | null;
    saldos: PeriodoSaldo[];
    totalPendientes: number;
    totalDisfrutados: number;
}

export function obtenerPerfil(): Promise<PerfilEmpleado> {
    return apiFetch('/empleados/yo');
}
