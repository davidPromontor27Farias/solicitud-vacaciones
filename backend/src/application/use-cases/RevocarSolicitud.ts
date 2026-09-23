import { Empleado } from "../../domain/entities/Empleado";
import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { SolicitudVacaciones } from "../../domain/entities/SolicitudVacaciones";
import { EmailNotifier } from "../ports/EmailNotifier";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors";
import { TransactionManager } from "../ports/TransactionManager";

function deduplicarDias(dias: Date[]): Date[] {
    const vistos = new Set<number>();
    return dias.filter((d) => {
        const t = d.getTime();
        if (vistos.has(t)) return false;
        vistos.add(t);
        return true;
    });
}

function inicioDelDiaUtc(fecha: Date): Date {
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

export interface RevocarSolicitudInput {
    solicitudId: string;
    revocadoPorId: string;
    motivo: string;
    // Si se omite, se revocan todos los dias que sigan activos (revocacion completa).
    // Si se especifica, solo esos dias (deben pertenecer a los dias activos de la
    // solicitud) — permite revocar, por ejemplo, solo 2 de 5 dias ya solicitados.
    dias?: Date[];
}

export class RevocarSolicitud {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
        private emailNotifier: EmailNotifier,
        private txtManager: TransactionManager
    ) {}

    async ejecutar(input: RevocarSolicitudInput): Promise<SolicitudVacaciones> {
        const solicitudInicial = await this.solicitudRepo.buscarPorId(input.solicitudId);
        if (!solicitudInicial) {
            throw new NotFoundError('Solicitud no encontrada');
        }

        const empleado = await this.empleadoRepo.buscarPorId(solicitudInicial.empleadoId);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        if (empleado.jefeDirectoId !== input.revocadoPorId && empleado.jefeMatricialId !== input.revocadoPorId) {
            throw new UnauthorizedError('No tienes permiso para revocar esta solicitud');
        }

        // Se bloquea al empleado y se vuelve a leer la solicitud ya con el lock tomado: si
        // dos revocaciones (o una revocacion y una aprobacion) del mismo empleado llegan casi
        // al mismo tiempo, la segunda espera a que la primera termine y ve los dias ya
        // marcados como revocados, en vez de calcular "dias activos" con datos obsoletos.
        const { solicitud, diasARevocar } = await this.txtManager.ejecutar(async (tx) => {
            await this.empleadoRepo.bloquearParaEscritura(empleado.id, tx);

            const solicitud = await this.solicitudRepo.buscarPorId(input.solicitudId, tx);
            if (!solicitud) {
                throw new NotFoundError('Solicitud no encontrada');
            }

            // Se deduplica por si el cliente manda la misma fecha repetida: sin esto se
            // restituirian/contarian de mas los dias duplicados.
            const diasARevocar = deduplicarDias(input.dias ?? solicitud.diasActivos);
            const hoy = inicioDelDiaUtc(new Date());
            const diaNoFuturo = diasARevocar.find((dia) => inicioDelDiaUtc(dia) <= hoy);
            if (diaNoFuturo) {
                throw new ValidationError('Solo se pueden revocar días que aún no han ocurrido');
            }

            try {
                solicitud.revocarDias(diasARevocar, input.motivo, input.revocadoPorId);
            } catch (error) {
                throw new ValidationError(error instanceof Error ? error.message : 'No se pudo revocar la solicitud');
            }

            // No hace falta restituir saldo: los dias futuros de una solicitud aprobada nunca se
            // descontaron (solo se descuentan al pasar la fecha), asi que revocarlos mientras
            // siguen en el futuro solo implica quitarlos de "programados".
            await this.solicitudRepo.actualizar(solicitud, tx);
            await this.solicitudRepo.marcarDiasRevocados(solicitud.id, diasARevocar, tx);

            return { solicitud, diasARevocar };
        });

        await this.notificar(empleado, solicitud, input.revocadoPorId, diasARevocar);

        return solicitud;
    }

    private async notificar(empleado: Empleado, solicitud: SolicitudVacaciones, revocadoPorId: string, diasARevocar: Date[]): Promise<void> {
        const fechas = [...diasARevocar]
            .sort((a, b) => a.getTime() - b.getTime())
            .map((d) => d.toISOString().slice(0, 10))
            .join(', ');
        const datosComunes = { dias: String(diasARevocar.length), fechas, motivo: solicitud.motivoRevocacion ?? '' };

        if (empleado.correoPersonal) {
            await this.emailNotifier.encolar({
                tipo: 'revocacion',
                destinatario: empleado.correoPersonal,
                solicitudId: solicitud.id,
                datos: datosComunes,
            });
        }


        const esDirectoQuienRevoco = revocadoPorId === empleado.jefeDirectoId;
        const otroJefeId = esDirectoQuienRevoco ? empleado.jefeMatricialId : empleado.jefeDirectoId;
        // Si el jefe directo y el matricial son la misma persona, no se le manda una
        // segunda notificacion de "el otro jefe" sobre su propia accion.
        if (empleado.recibeNotificacionesMatricial && otroJefeId && otroJefeId !== revocadoPorId) {
            const otroJefe = await this.empleadoRepo.buscarPorId(otroJefeId);
            if (otroJefe?.correoParaSolicitudes) {
                await this.emailNotifier.encolar({
                    tipo: 'revocacion',
                    destinatario: otroJefe.correoParaSolicitudes,
                    solicitudId: solicitud.id,
                    datos: { ...datosComunes, empleado: empleado.nombre },
                });
            }
        }
    }
}
