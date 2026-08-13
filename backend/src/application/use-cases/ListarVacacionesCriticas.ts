import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";


const SIN_DEPARTAMENTO = 'Sin departamento';

export interface VacacionCriticasResultado {
    empleadoId: string;
    numeroEmpleado: string;
    nombre: string;
    departamento: string;
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
        private saldoRepo: SaldoVacacionesRepository
    ){}

    async ejecutar(fechaReferencia: Date = new Date()): Promise<VacacionCriticasResultado[]>{
        const [saldos, empleados] = await Promise.all([
            this.saldoRepo.listarConDiasPendientes(),
            this.empleadoRepo.listarTodos()
        ]);

        const empleadosPorId = new Map(empleados.map(e => [e.id, e]));
        const resultado: VacacionCriticasResultado[] = [];

        for(const saldo of saldos){
            const diasParaVencer = saldo.diasPorVencer(fechaReferencia);
            if(!saldo.estaVencido(fechaReferencia) && !saldo.estaCritico(fechaReferencia)) continue;

            const empleado = empleadosPorId.get(saldo.empleadoId);
            if(!empleado) continue;

            const jefe = empleado.jefeDirectoId ? empleadosPorId.get(empleado.jefeDirectoId): null;

            resultado.push({
                empleadoId: empleado.id,
                numeroEmpleado: empleado.numeroEmpleado,
                nombre: empleado.nombre,
                departamento: empleado.departamento?.trim() || SIN_DEPARTAMENTO,
                puesto: empleado.puesto,
                jefeDirecto: jefe ? {nombre: jefe.nombre} : null,
                saldoId: saldo.id,
                diasPendientes: saldo.diasPendientes,
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