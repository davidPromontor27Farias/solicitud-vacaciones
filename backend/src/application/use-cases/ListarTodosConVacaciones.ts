import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { EmpleadoEquipoResultado, SaldoEquipoResultado } from "./ListarEquipoConVacaciones";
import { calcularConsumoSaldo, calcularDiasPasadosYFuturos } from "../../domain/services/consumoSaldo";

const SIN_DEPARTAMENTO = 'Sin departamento';

export class ListarTodosConVacaciones {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
    ) {}

    async ejecutar(fechaReferencia: Date = new Date()): Promise<EmpleadoEquipoResultado[]> {
        const [empleados, saldos, aprobadas] = await Promise.all([
            this.empleadoRepo.listarTodos(),
            this.saldoRepo.listarTodos(),
            this.solicitudRepo.listarAprobadasTodas(),
        ]);

        const saldosPorEmpleadoId = new Map<string, typeof saldos>();
        for (const saldo of saldos) {
            const lista = saldosPorEmpleadoId.get(saldo.empleadoId) ?? [];
            lista.push(saldo);
            saldosPorEmpleadoId.set(saldo.empleadoId, lista);
        }

        const aprobadasPorEmpleadoId = new Map<string, typeof aprobadas>();
        for (const solicitud of aprobadas) {
            const lista = aprobadasPorEmpleadoId.get(solicitud.empleadoId) ?? [];
            lista.push(solicitud);
            aprobadasPorEmpleadoId.set(solicitud.empleadoId, lista);
        }

        const resultado: EmpleadoEquipoResultado[] = [];
        for (const empleado of empleados) {
            const saldosDelEmpleado = saldosPorEmpleadoId.get(empleado.id) ?? [];
            if (saldosDelEmpleado.length === 0) continue;

            const saldosOrdenados = [...saldosDelEmpleado].sort(
                (a, b) => a.fechaLimiteDisfrute.getTime() - b.fechaLimiteDisfrute.getTime(),
            );

            const aprobadasDelEmpleado = aprobadasPorEmpleadoId.get(empleado.id) ?? [];
            const { pasados, futuros } = calcularDiasPasadosYFuturos(saldosDelEmpleado, aprobadasDelEmpleado, fechaReferencia);

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
