import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { SaldoVacaciones } from "../../domain/entities/SaldoVacaciones";

export interface SaldoReporteSapResultado {
    numeroEmpleado: string;
    nombre: string;
    sociedad: string | null;
    puesto: string | null;
    departamento: string | null;
    backupNombre: string | null;
    jefeInmediato: string | null;
    jefeMatricial: string | null;
    diasPorLey: number;
    diasDisfrutados: number;
    inicioValidez: Date;
    finValidez: Date;
    fechaVencimiento: Date;
    fechaLimiteDisfrute: Date;
}

export interface ExportarSaldosSapInput {
    desde: Date;
    hasta: Date;
}

export class ExportarSaldosSap {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
    ) {}

    async ejecutar(input: ExportarSaldosSapInput): Promise<SaldoReporteSapResultado[]> {
        const empleados = await this.empleadoRepo.listarTodos();
        const empleadosPorId = new Map(empleados.map((e) => [e.id, e]));

        // Paso 1: solo nos interesan los empleados que tuvieron al menos un dia
        // aprobado y activo (no revocado) dentro de la quincena que se esta reportando.
        const solicitudesEnRango = await this.solicitudRepo.listarPorPeriodo(input.desde, input.hasta);
        const empleadoIdsConActividad = new Set<string>();
        for (const s of solicitudesEnRango) {
            if (s.estatus !== 'aprobada') continue;
            const tieneDiaEnRango = s.diasActivos.some((d) => d >= input.desde && d <= input.hasta);
            if (tieneDiaEnRango) empleadoIdsConActividad.add(s.empleadoId);
        }

        const resultado: SaldoReporteSapResultado[] = [];
        for (const empleadoId of empleadoIdsConActividad) {
            const empleado = empleadosPorId.get(empleadoId);
            if (!empleado) continue;

            const saldos = await this.saldoRepo.listarPorEmpleadoId(empleadoId);
            const aprobadas = await this.solicitudRepo.listarAprobadasPorEmpleado(empleadoId);

            // Dias ya transcurridos (a la fecha de corte "hasta") por cada saldo/periodo,
            // para calcular el total acumulado de dias disfrutados a reportar — no solo
            // los de esta quincena, el acumulado real del periodo completo.
            const diasEnRangoPorSaldoId = new Map<string, boolean>();
            const diasTranscurridosPorSaldoId = new Map<string, number>();
            for (const solicitud of aprobadas) {
                for (const dia of solicitud.diasActivos) {
                    const saldoDelDia = saldos.find((s) => s.estaVigente(dia));
                    if (!saldoDelDia) continue;
                    if (dia >= input.desde && dia <= input.hasta) {
                        diasEnRangoPorSaldoId.set(saldoDelDia.id, true);
                    }
                    if (dia <= input.hasta) {
                        diasTranscurridosPorSaldoId.set(saldoDelDia.id, (diasTranscurridosPorSaldoId.get(saldoDelDia.id) ?? 0) + 1);
                    }
                }
            }

            const jefeDirecto = empleado.jefeDirectoId ? empleadosPorId.get(empleado.jefeDirectoId) : null;
            const jefeMatricial = empleado.jefeMatricialId ? empleadosPorId.get(empleado.jefeMatricialId) : null;

            for (const saldo of saldos) {
                // Solo se reporta el periodo que tuvo actividad en esta quincena, pero el
                // descuento que se muestra es el acumulado real, no solo el de la quincena.
                if (!diasEnRangoPorSaldoId.has(saldo.id)) continue;

                resultado.push({
                    numeroEmpleado: empleado.numeroEmpleado,
                    nombre: empleado.nombre,
                    sociedad: empleado.sociedad,
                    puesto: empleado.puesto,
                    departamento: empleado.departamento,
                    backupNombre: empleado.backupNombre,
                    jefeInmediato: jefeDirecto?.nombre ?? null,
                    jefeMatricial: jefeMatricial?.nombre ?? null,
                    diasPorLey: saldo.diasPorLey,
                    diasDisfrutados: this.diasDisfrutadosActualizado(saldo, diasTranscurridosPorSaldoId),
                    inicioValidez: saldo.inicioValidez,
                    finValidez: saldo.finValidez,
                    fechaVencimiento: saldo.fechaVencimiento,
                    fechaLimiteDisfrute: saldo.fechaLimiteDisfrute,
                });
            }
        }

        return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    // Igual que en ObtenerPerfilEmpleado: nunca se retrocede el valor que ya trajo SAP,
    // solo se adopta el local cuando ya lo supero (dias aprobados que SAP aun no procesa).
    private diasDisfrutadosActualizado(saldo: SaldoVacaciones, transcurridos: Map<string, number>): number {
        return Math.max(saldo.diasDisfrutados, transcurridos.get(saldo.id) ?? 0);
    }
}
