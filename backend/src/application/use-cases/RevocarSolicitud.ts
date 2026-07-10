import { Empleado } from "../../domain/entities/Empleado";
import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { SolicitudVacaciones } from "../../domain/entities/SolicitudVacaciones";
import { EmailNotifier } from "../ports/EmailNotifier";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors";

export interface RevocarSolicitudInput {
    solicitudId: string;
    revocadoPorId: string;
    motivo: string;
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

        if (empleado.jefeDirectoId !== input.revocadoPorId) {
            throw new UnauthorizedError('No tienes permiso para revocar esta solicitud');
        }

        try {
            solicitud.revocar(input.motivo, input.revocadoPorId);
        } catch (error) {
            throw new ValidationError(error instanceof Error ? error.message : 'No se pudo revocar la solicitud');
        }
        await this.solicitudRepo.actualizar(solicitud);

        await this.restituirSaldo(empleado, solicitud);
        await this.notificar(empleado, solicitud);

        return solicitud;
    }

    private async restituirSaldo(empleado: Empleado, solicitud: SolicitudVacaciones): Promise<void> {
        const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id);
        if (saldos.length === 0) {
            throw new ValidationError('El empleado no tiene periodos de saldo registrados');
        }

        const primerDia = solicitud.dias[0];
        const vigentes = saldos
            .filter((s) => s.estaVigente(primerDia))
            .sort((a, b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime());

        const destino = vigentes[0]
            ?? [...saldos].sort((a, b) => b.inicioValidez.getTime() - a.inicioValidez.getTime())[0];

        destino.restituirDias(solicitud.cantidadDias);
        await this.saldoRepo.guardar(destino);
    }

    private async notificar(empleado: Empleado, solicitud: SolicitudVacaciones): Promise<void> {
        if (empleado.correoPersonal) {
            await this.emailNotifier.encolar({
                tipo: 'revocacion',
                destinatario: empleado.correoPersonal,
                solicitudId: solicitud.id,
                datos: { dias: String(solicitud.cantidadDias), motivo: solicitud.motivoRevocacion ?? '' },
            });
        }

        if (empleado.recibeNotificacionesMatricial && empleado.jefeMatricialId) {
            const jefeMatricial = await this.empleadoRepo.buscarPorId(empleado.jefeMatricialId);
            if (jefeMatricial?.correoPersonal) {
                await this.emailNotifier.encolar({
                    tipo: 'revocacion',
                    destinatario: jefeMatricial.correoPersonal,
                    solicitudId: solicitud.id,
                    datos: { empleado: empleado.nombre, dias: String(solicitud.cantidadDias) },
                });
            }
        }
    }
}