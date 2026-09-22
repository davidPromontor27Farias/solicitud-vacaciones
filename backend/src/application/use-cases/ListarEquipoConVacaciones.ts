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

        const resultado: EmpleadoEquipoResultado[] = [];
        for (const empleado of equipo) {
            const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id);
            const saldosOrdenados = [...saldos].sort(
                (a, b) => a.fechaLimiteDisfrute.getTime() - b.fechaLimiteDisfrute.getTime(),
            );

            // Un dia aprobado solo se descuenta del saldo (pasa a "disfrutado") una vez que ya
            // ocurrio; mientras sea futuro se muestra en "programado" sin afectar los dias
            // disponibles.
            const aprobadas = await this.solicitudRepo.listarAprobadasPorEmpleado(empleado.id);
            const { pasados, futuros } = calcularDiasPasadosYFuturos(saldos, aprobadas, fechaReferencia);

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
