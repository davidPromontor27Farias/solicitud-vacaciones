import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { calcularConsumoSaldo, calcularDiasPasadosYFuturos } from "../../domain/services/consumoSaldo";

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

export interface EmpleadoEquipoResultado {
    empleadoId: string;
    numeroEmpleado: string;
    nombre: string;
    departamento: string | null;
    puesto: string | null;
    diasRechazados: number;
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
        const empleadoIds = equipo.map((e) => e.id);

        // Se trae el saldo y las solicitudes aprobadas de todo el equipo en 2 consultas (no una
        // por empleado): con equipos grandes, N consultas secuenciales hacian que la pantalla
        // tardara decenas de segundos en cargar.
        const [todosSaldos, todasAprobadas, todasRechazadas] = await Promise.all([
            this.saldoRepo.listarPorEmpleadoIds(empleadoIds),
            this.solicitudRepo.listarAprobadasPorEmpleados(empleadoIds),
            this.solicitudRepo.listarRechazadasPorEmpleados(empleadoIds),
        ]);

        const saldosPorEmpleadoId = new Map<string, typeof todosSaldos>();
        for (const saldo of todosSaldos) {
            const lista = saldosPorEmpleadoId.get(saldo.empleadoId) ?? [];
            lista.push(saldo);
            saldosPorEmpleadoId.set(saldo.empleadoId, lista);
        }
        const aprobadasPorEmpleadoId = new Map<string, typeof todasAprobadas>();
        for (const solicitud of todasAprobadas) {
            const lista = aprobadasPorEmpleadoId.get(solicitud.empleadoId) ?? [];
            lista.push(solicitud);
            aprobadasPorEmpleadoId.set(solicitud.empleadoId, lista);
        }

        // Una solicitud rechazada se rechaza completa (no hay rechazo parcial de dias, a
        // diferencia de la revocacion), asi que todos sus dias cuentan.
        const diasRechazadosPorEmpleadoId = new Map<string, number>();
        for (const solicitud of todasRechazadas) {
            diasRechazadosPorEmpleadoId.set(
                solicitud.empleadoId,
                (diasRechazadosPorEmpleadoId.get(solicitud.empleadoId) ?? 0) + solicitud.cantidadDias,
            );
        }

        const resultado: EmpleadoEquipoResultado[] = [];
        for (const empleado of equipo) {
            const saldos = saldosPorEmpleadoId.get(empleado.id) ?? [];
            const saldosOrdenados = [...saldos].sort(
                (a, b) => a.fechaLimiteDisfrute.getTime() - b.fechaLimiteDisfrute.getTime(),
            );

            // Un dia aprobado solo se descuenta del saldo (pasa a "disfrutado") una vez que ya
            // ocurrio; mientras sea futuro se muestra en "programado" sin afectar los dias
            // disponibles.
            const aprobadas = aprobadasPorEmpleadoId.get(empleado.id) ?? [];
            const { pasados, futuros } = calcularDiasPasadosYFuturos(saldos, aprobadas, fechaReferencia);

            resultado.push({
                empleadoId: empleado.id,
                numeroEmpleado: empleado.numeroEmpleado,
                nombre: empleado.nombre,
                departamento: empleado.departamento,
                puesto: empleado.puesto,
                diasRechazados: diasRechazadosPorEmpleadoId.get(empleado.id) ?? 0,
                saldos: saldosOrdenados.map((saldo) => {
                    const estado: SaldoEquipoResultado['estado'] = saldo.estaVencido(fechaReferencia)
                        ? 'vencido'
                        : saldo.estaCritico(fechaReferencia)
                            ? 'critico'
                            : 'vigente';
                    const consumo = calcularConsumoSaldo(saldo, pasados.get(saldo.id) ?? 0, futuros.get(saldo.id) ?? 0);
                    return {
                        id: saldo.id,
                        diasPorLey: saldo.diasPorLey,
                        diasDisfrutados: consumo.diasDisfrutados,
                        diasPendientes: consumo.diasPendientes,
                        diasProgramados: consumo.diasProgramados,
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
