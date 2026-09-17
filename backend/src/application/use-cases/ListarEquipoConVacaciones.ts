import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";

export interface SaldoEquipoResultado {
    id: string;
    diasPorLey: number;
    diasDisfrutados: number;
    diasPendientes: number;
    diasProgramados: number;
    inicioValidez: Date;
    finValidez: Date;
    fechaLimiteDisfrute: Date;
    diasParaVencer: number;
    estado: 'vencido' | 'critico' | 'vigente';
}

function inicioDelDiaUtc(fecha: Date): Date {
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

export interface EmpleadoEquipoResultado {
    empleadoId: string;
    numeroEmpleado: string;
    nombre: string;
    departamento: string | null;
    puesto: string | null;
    saldos: SaldoEquipoResultado[];
}

export class ListarEquipoConVacaciones {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
    ) {}

    async ejecutar(jefeId: string, fechaReferencia: Date = new Date()): Promise<EmpleadoEquipoResultado[]> {
        const equipo = await this.empleadoRepo.listarEquipoDirecto(jefeId);
        const hoyUtc = inicioDelDiaUtc(fechaReferencia);

        const resultado: EmpleadoEquipoResultado[] = [];
        for (const empleado of equipo) {
            const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id);
            const saldosOrdenados = [...saldos].sort(
                (a, b) => a.fechaLimiteDisfrute.getTime() - b.fechaLimiteDisfrute.getTime(),
            );

            // Dias de vacaciones ya aprobadas cuya fecha todavia no llega, agrupados por el
            // periodo (saldo) al que pertenecen — para poder mostrar cuanto de lo "por vencer"
            // ya esta programado y cuanto sigue sin planearse.
            const aprobadas = await this.solicitudRepo.listarAprobadasPorEmpleado(empleado.id);
            const diasProgramadosPorSaldoId = new Map<string, number>();
            for (const solicitud of aprobadas) {
                for (const dia of solicitud.diasActivos) {
                    if (dia < hoyUtc) continue;
                    const saldoDelDia = saldos.find((s) => s.estaVigente(dia));
                    if (!saldoDelDia) continue;
                    diasProgramadosPorSaldoId.set(saldoDelDia.id, (diasProgramadosPorSaldoId.get(saldoDelDia.id) ?? 0) + 1);
                }
            }

            resultado.push({
                empleadoId: empleado.id,
                numeroEmpleado: empleado.numeroEmpleado,
                nombre: empleado.nombre,
                departamento: empleado.departamento,
                puesto: empleado.puesto,
                saldos: saldosOrdenados.map((saldo) => {
                    const estado: SaldoEquipoResultado['estado'] = saldo.estaVencido(fechaReferencia)
                        ? 'vencido'
                        : saldo.estaCritico(fechaReferencia)
                            ? 'critico'
                            : 'vigente';
                    return {
                        id: saldo.id,
                        diasPorLey: saldo.diasPorLey,
                        diasDisfrutados: saldo.diasDisfrutados,
                        diasPendientes: saldo.diasPendientes,
                        diasProgramados: diasProgramadosPorSaldoId.get(saldo.id) ?? 0,
                        inicioValidez: saldo.inicioValidez,
                        finValidez: saldo.finValidez,
                        fechaLimiteDisfrute: saldo.fechaLimiteDisfrute,
                        diasParaVencer: saldo.diasPorVencer(fechaReferencia),
                        estado,
                    };
                }),
            });
        }

        return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
}
