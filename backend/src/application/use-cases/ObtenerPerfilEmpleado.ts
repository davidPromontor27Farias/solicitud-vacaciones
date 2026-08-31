import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { SaldoVacaciones } from "../../domain/entities/SaldoVacaciones";
import { NotFoundError } from "../../shared/errors";

export interface PeriodoSaldoResultado {
    diasPorLey: number;
    diasDisfrutados: number;
    diasAprobados: number;
    diasPendientes: number;
    inicioValidez: Date;
    fechaVencimiento: Date;
    finValidez: Date;
    fechaLimiteDisfrute: Date;
    anioInicio: number;
    anioFin: number;
    estado: 'disponible' | 'proximo' | 'vencido';
}

export interface VacacionProgramadaResultado {
    solicitudId: string;
    dias: Date[];
    cantidadDias: number;
}

export interface PerfilEmpleadoResultado {
    nombre: string;
    numeroEmpleado: string;
    sociedad: string | null;
    puesto: string | null;
    departamento: string | null;
    correoPersonal: string | null;
    jefeDirecto: { nombre: string } | null;
    esJefe: boolean;
    saldos: PeriodoSaldoResultado[];
    totalPendientes: number;
    totalDisfrutados: number;
    totalProgramados: number;
    vacacionesProgramadas: VacacionProgramadaResultado[];
    backupNombre: string | null;
}

function inicioDelDiaUtc(fecha: Date): Date {
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

export class ObtenerPerfilEmpleado {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
    ) {}

    async ejecutar(empleadoId: string): Promise<PerfilEmpleadoResultado> {
        const empleado = await this.empleadoRepo.buscarPorId(empleadoId);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        let jefeDirecto: { nombre: string } | null = null;
        if (empleado.jefeDirectoId) {
            const jefe = await this.empleadoRepo.buscarPorId(empleado.jefeDirectoId);
            jefeDirecto = jefe ? { nombre: jefe.nombre } : null;
        }

        const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id);
        const saldosOrdenados = [...saldos].sort((a, b) => a.inicioValidez.getTime() - b.inicioValidez.getTime());

        const hoy = new Date();
        const hoyUtc = inicioDelDiaUtc(hoy);
        const saldosVigentes = saldos.filter((s) => s.estaVigente(hoy));

        const equipoDirecto = await this.empleadoRepo.listarEquipoDirecto(empleado.id);

        // Un dia de una solicitud aprobada solo cuenta como "disfrutado" (ocupado) una vez que
        // ya paso. Mientras la fecha sea futura se muestra aparte, como "programado", para no
        // inflar el consumo real antes de que la vacacion realmente ocurra.
        const aprobadas = await this.solicitudRepo.listarAprobadasPorEmpleado(empleado.id);

        const diasPasadosPorSaldoId = new Map<string, number>();
        const diasFuturosPorSaldoId = new Map<string, number>();
        const vacacionesProgramadas: VacacionProgramadaResultado[] = [];
        for (const solicitud of aprobadas) {
            const diasFuturos = solicitud.dias.filter((dia) => dia >= hoyUtc);
            if (diasFuturos.length > 0) {
                vacacionesProgramadas.push({
                    solicitudId: solicitud.id,
                    dias: diasFuturos.sort((a, b) => a.getTime() - b.getTime()),
                    cantidadDias: diasFuturos.length,
                });
            }

            for (const dia of solicitud.dias) {
                const saldoDelDia = saldos.find((s) => s.estaVigente(dia));
                if (!saldoDelDia) continue;
                const mapa = dia >= hoyUtc ? diasFuturosPorSaldoId : diasPasadosPorSaldoId;
                mapa.set(saldoDelDia.id, (mapa.get(saldoDelDia.id) ?? 0) + 1);
            }
        }
        vacacionesProgramadas.sort((a, b) => a.dias[0].getTime() - b.dias[0].getTime());

        // Ante desfase con SAP (nomina aun no procesa la liquidacion de dias ya tomados), se
        // toma el mayor entre lo que SAP ya confirmo y lo que localmente ya transcurrio, para
        // no retroceder el contador ni duplicar el conteo cuando SAP alcance al sistema.
        const diasDisfrutadosMostrado = (saldo: SaldoVacaciones): number =>
            Math.max(saldo.diasDisfrutados, diasPasadosPorSaldoId.get(saldo.id) ?? 0);

        // Total de dias ya comprometidos en solicitudes aprobadas para este periodo, ya
        // hayan ocurrido (disfrutados) o esten agendados a futuro (programados).
        const diasAprobadosMostrado = (saldo: SaldoVacaciones): number =>
            diasDisfrutadosMostrado(saldo) + (diasFuturosPorSaldoId.get(saldo.id) ?? 0);

        return {
            nombre: empleado.nombre,
            numeroEmpleado: empleado.numeroEmpleado,
            sociedad: empleado.sociedad,
            puesto: empleado.puesto,
            departamento: empleado.departamento,
            correoPersonal: empleado.correoPersonal,
            jefeDirecto,
            backupNombre: empleado.backupNombre,
            esJefe: equipoDirecto.length > 0,
            saldos: saldosOrdenados.map((s) => ({
                diasPorLey: s.diasPorLey,
                diasDisfrutados: diasDisfrutadosMostrado(s),
                diasAprobados: diasAprobadosMostrado(s),
                diasPendientes: s.diasPendientes,
                inicioValidez: s.inicioValidez,
                finValidez: s.finValidez,
                fechaVencimiento: s.fechaVencimiento,
                fechaLimiteDisfrute: s.fechaLimiteDisfrute,
                anioInicio: s.inicioValidez.getFullYear(),
                anioFin: s.finValidez.getFullYear(),
                estado: s.estaVencido(hoy) ? 'vencido' : s.estaVigente(hoy) ? 'disponible' : 'proximo',
            })),
            totalPendientes: saldosVigentes.reduce((acc, s) => acc + s.diasPendientes, 0),
            totalDisfrutados: saldos.reduce((acc, s) => acc + diasDisfrutadosMostrado(s), 0),
            totalProgramados: vacacionesProgramadas.reduce((acc, v) => acc + v.cantidadDias, 0),
            vacacionesProgramadas,
        };
    }
}
