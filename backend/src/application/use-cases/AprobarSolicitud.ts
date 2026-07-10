import { Empleado } from "../../domain/entities/Empleado";
import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { SolicitudVacaciones } from "../../domain/entities/SolicitudVacaciones";
import { EmailNotifier } from "../ports/EmailNotifier";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors";

export interface AprobarSolicitudInput {
    solicitudId: string;
    aprobadorId: string;
    backupNombre: string;
}

export class AprobarSolicitud {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
        private emailNotifier: EmailNotifier,
    ) {}

    async ejecutar(input: AprobarSolicitudInput): Promise<SolicitudVacaciones> {
        const solicitud = await this.solicitudRepo.buscarPorId(input.solicitudId);
        if (!solicitud) {
            throw new NotFoundError('Solicitud no encontrada');
        }

        const empleado = await this.empleadoRepo.buscarPorId(solicitud.empleadoId);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        if (empleado.jefeDirectoId !== input.aprobadorId) {
            throw new UnauthorizedError('No tienes permiso para aprobar esta solicitud');
        }

        const primerDia = solicitud.dias[0];
        const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id);
        const vigentes = saldos
            .filter((s) => s.estaVigente(primerDia))
            .sort((a, b) => a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime());

        const totalDisponible = vigentes.reduce((acc, s) => acc + s.diasPendientes, 0);
        if (totalDisponible < solicitud.cantidadDias) {
            throw new ValidationError('El empleado ya no cuenta con suficientes días disponibles');
        }

        let restante = solicitud.cantidadDias;
        for (const saldo of vigentes) {
            if (restante === 0) break;
            const aDescontar = Math.min(saldo.diasPendientes, restante);
            if (aDescontar > 0) {
                saldo.descontarDias(aDescontar);
                await this.saldoRepo.guardar(saldo);
                restante -= aDescontar;
            }
        }

        try {
            solicitud.aprobar(input.backupNombre);
        } catch (error) {
            throw new ValidationError(error instanceof Error ? error.message : 'No se pudo aprobar la solicitud');
        }
        await this.solicitudRepo.actualizar(solicitud);

        await this.notificar(empleado, solicitud);

        return solicitud;
    }

    private async notificar(empleado: Empleado, solicitud: SolicitudVacaciones): Promise<void> {
        if (empleado.correoPersonal) {
            await this.emailNotifier.encolar({
                tipo: 'aprobacion_empleado',
                destinatario: empleado.correoPersonal,
                solicitudId: solicitud.id,
                datos: { dias: String(solicitud.cantidadDias), backup: solicitud.backupNombre ?? '' },
            });
        }

        if (empleado.recibeNotificacionesMatricial && empleado.jefeMatricialId) {
            const jefeMatricial = await this.empleadoRepo.buscarPorId(empleado.jefeMatricialId);
            if (jefeMatricial?.correoPersonal) {
                await this.emailNotifier.encolar({
                    tipo: 'aprobacion_jefe_matricial',
                    destinatario: jefeMatricial.correoPersonal,
                    solicitudId: solicitud.id,
                    datos: { empleado: empleado.nombre, dias: String(solicitud.cantidadDias) },
                });
            }
        }
    }
}