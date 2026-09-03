import { Empleado } from "../../domain/entities/Empleado";
import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { SolicitudVacaciones } from "../../domain/entities/SolicitudVacaciones";
import { EmailNotifier } from "../ports/EmailNotifier";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors";

function deduplicarDias(dias: Date[]): Date[] {
    const vistos = new Set<number>();
    return dias.filter((d) => {
        const t = d.getTime();
        if (vistos.has(t)) return false;
        vistos.add(t);
        return true;
    });
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
        private saldoRepo: SaldoVacacionesRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
        private emailNotifier: EmailNotifier,
    ) {}

    async ejecutar(input: RevocarSolicitudInput): Promise<SolicitudVacaciones> {
        const solicitud = await this.solicitudRepo.buscarPorId(input.solicitudId);
        if (!solicitud) {
            throw new NotFoundError('Solicitud no encontrada');
        }

        const empleado = await this.empleadoRepo.buscarPorId(solicitud.empleadoId);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        if (empleado.jefeDirectoId !== input.revocadoPorId && empleado.jefeMatricialId !== input.revocadoPorId) {
            throw new UnauthorizedError('No tienes permiso para revocar esta solicitud');
        }

        // Se deduplica por si el cliente manda la misma fecha repetida: sin esto se
        // restituirian/contarian de mas los dias duplicados.
        const diasARevocar = deduplicarDias(input.dias ?? solicitud.diasActivos);

        try {
            solicitud.revocarDias(diasARevocar, input.motivo, input.revocadoPorId);
        } catch (error) {
            throw new ValidationError(error instanceof Error ? error.message : 'No se pudo revocar la solicitud');
        }
        await this.solicitudRepo.actualizar(solicitud);
        await this.solicitudRepo.marcarDiasRevocados(solicitud.id, diasARevocar);

        await this.restituirSaldo(empleado, diasARevocar);
        await this.notificar(empleado, solicitud, input.revocadoPorId, diasARevocar);

        return solicitud;
    }

    private async restituirSaldo(empleado: Empleado, diasARevocar: Date[]): Promise<void> {
        const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id);
        if (saldos.length === 0) {
            throw new ValidationError('El empleado no tiene periodos de saldo registrados');
        }

        // Cada dia revocado se devuelve al periodo (saldo) al que realmente pertenece, no
        // todos de golpe al primero: una solicitud puede cruzar dos periodos si se pidio
        // cerca de una renovacion.
        const cantidadPorSaldoId = new Map<string, number>();
        for (const dia of diasARevocar) {
            const vigentes = saldos
                .filter((s) => s.estaVigente(dia))
                .sort((a, b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime());
            const destino = vigentes[0]
                ?? [...saldos].sort((a, b) => b.inicioValidez.getTime() - a.inicioValidez.getTime())[0];
            cantidadPorSaldoId.set(destino.id, (cantidadPorSaldoId.get(destino.id) ?? 0) + 1);
        }

        for (const [saldoId, cantidad] of cantidadPorSaldoId) {
            const saldo = saldos.find((s) => s.id === saldoId)!;
            saldo.restituirDias(cantidad);
            await this.saldoRepo.guardar(saldo);
        }
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
