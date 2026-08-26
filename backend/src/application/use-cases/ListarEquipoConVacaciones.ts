import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";

export interface SaldoEquipoResultado {
    id: string;
    diasPorLey: number;
    diasDisfrutados: number;
    diasPendientes: number;
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
    ) {}

    async ejecutar(jefeId: string, fechaReferencia: Date = new Date()): Promise<EmpleadoEquipoResultado[]> {
        const equipo = await this.empleadoRepo.listarEquipoDirecto(jefeId);

        const resultado: EmpleadoEquipoResultado[] = [];
        for (const empleado of equipo) {
            const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id);
            const saldosOrdenados = [...saldos].sort(
                (a, b) => a.fechaLimiteDisfrute.getTime() - b.fechaLimiteDisfrute.getTime(),
            );

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
