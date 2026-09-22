import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { calcularConsumoSaldo, calcularDiasPasadosYFuturos } from "../../domain/services/consumoSaldo";


const SIN_DEPARTAMENTO = 'Sin departamento';

export interface VacacionCriticasResultado {
    empleadoId: string;
    numeroEmpleado: string;
    nombre: string;
    departamento: string;
    sociedad: string | null;
    puesto: string | null;
    jefeDirecto: {nombre: string} | null;
    saldoId: string;
    diasPendientes: number;
    fechaVencimiento: Date;
    diasParaVencer: number;
    estado: 'vencido' | 'critico';
}

export class ListarVacacionesCriticas {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
    ){}

    async ejecutar(fechaReferencia: Date = new Date()): Promise<VacacionCriticasResultado[]>{
        const [saldos, empleados, aprobadas] = await Promise.all([
            this.saldoRepo.listarConDiasPendientes(),
            this.empleadoRepo.listarTodos(),
            this.solicitudRepo.listarAprobadasTodas(),
        ]);

        const empleadosPorId = new Map(empleados.map(e => [e.id, e]));
        const aprobadasPorEmpleadoId = new Map<string, typeof aprobadas>();
        for (const solicitud of aprobadas) {
            const lista = aprobadasPorEmpleadoId.get(solicitud.empleadoId) ?? [];
            lista.push(solicitud);
            aprobadasPorEmpleadoId.set(solicitud.empleadoId, lista);
        }

        const resultado: VacacionCriticasResultado[] = [];

        for(const saldo of saldos){
            const diasParaVencer = saldo.diasPorVencer(fechaReferencia);
            if(!saldo.estaVencido(fechaReferencia) && !saldo.estaCritico(fechaReferencia)) continue;

            const empleado = empleadosPorId.get(saldo.empleadoId);
            if(!empleado) continue;

            const jefe = empleado.jefeDirectoId ? empleadosPorId.get(empleado.jefeDirectoId): null;

            const saldosDelEmpleado = saldos.filter((s) => s.empleadoId === empleado.id);
            const { pasados, futuros } = calcularDiasPasadosYFuturos(saldosDelEmpleado, aprobadasPorEmpleadoId.get(empleado.id) ?? [], fechaReferencia);
            const diasPendientes = calcularConsumoSaldo(saldo, pasados.get(saldo.id) ?? 0, futuros.get(saldo.id) ?? 0).diasPendientes;

            resultado.push({
                empleadoId: empleado.id,
                numeroEmpleado: empleado.numeroEmpleado,
                nombre: empleado.nombre,
                departamento: empleado.departamento?.trim() || SIN_DEPARTAMENTO,
                sociedad: empleado.sociedad,
                puesto: empleado.puesto,
                jefeDirecto: jefe ? {nombre: jefe.nombre} : null,
                saldoId: saldo.id,
                diasPendientes,
                // fechaLimiteDisfrute (no fechaVencimiento) para que la fecha mostrada
                // coincida con la que usa estaVencido()/diasPorVencer() al clasificar el estado.
                fechaVencimiento: saldo.fechaLimiteDisfrute,
                diasParaVencer,
                estado: saldo.estaVencido(fechaReferencia) ? 'vencido' : 'critico'
            })
        }

        return resultado.sort((a, b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime());
    }

}