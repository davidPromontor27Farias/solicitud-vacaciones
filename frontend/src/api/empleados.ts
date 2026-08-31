import { apiFetch } from './client';

export interface PeriodoSaldo {
    diasPorLey: number;
    diasDisfrutados: number;
    diasAprobados: number;
    diasPendientes: number;
    inicioValidez: string;
    finValidez: string;
    fechaVencimiento: string;
    fechaLimiteDisfrute: string;
    anioInicio: number;
    anioFin: number;
    estado: 'disponible' | 'proximo' | 'vencido';
}

export interface VacacionProgramada {
    solicitudId: string;
    dias: string[];
    cantidadDias: number;
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
    totalProgramados: number;
    vacacionesProgramadas: VacacionProgramada[];
}

export function obtenerPerfil(): Promise<PerfilEmpleado> {
    return apiFetch('/empleados/yo');
}
