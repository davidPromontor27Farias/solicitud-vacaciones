import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { EmpleadoEquipoResultado, SaldoEquipoResultado } from "./ListarEquipoConVacaciones";

const SIN_DEPARTAMENTO = 'Sin departamento';

export class ListarTodosConVacaciones {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
    ) {}

    async ejecutar(fechaReferencia: Date = new Date()): Promise<EmpleadoEquipoResultado[]> {
        const [empleados, saldos] = await Promise.all([
            this.empleadoRepo.listarTodos(),
            this.saldoRepo.listarTodos(),
        ]);

        const saldosPorEmpleadoId = new Map<string, typeof saldos>();
        for (const saldo of saldos) {
            const lista = saldosPorEmpleadoId.get(saldo.empleadoId) ?? [];
            lista.push(saldo);
            saldosPorEmpleadoId.set(saldo.empleadoId, lista);
        }

        const resultado: EmpleadoEquipoResultado[] = [];
        for (const empleado of empleados) {
            const saldosDelEmpleado = saldosPorEmpleadoId.get(empleado.id) ?? [];
            if (saldosDelEmpleado.length === 0) continue;

            const saldosOrdenados = [...saldosDelEmpleado].sort(
                (a, b) => a.fechaLimiteDisfrute.getTime() - b.fechaLimiteDisfrute.getTime(),
            );

            resultado.push({
                empleadoId: empleado.id,
                numeroEmpleado: empleado.numeroEmpleado,
                nombre: empleado.nombre,
                departamento: empleado.departamento?.trim() || SIN_DEPARTAMENTO,
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
