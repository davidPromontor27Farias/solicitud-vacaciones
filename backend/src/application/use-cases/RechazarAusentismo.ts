import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { AusentismoRepository } from "../../domain/repositories/AusentismoRepository";
import { Ausentismo } from "../../domain/entities/Ausentismo";
import { EmailNotifier } from "../ports/EmailNotifier";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors";

export interface RechazarAusentismoInput {
    ausentismoId: string;
    aprobadorId: string;
    motivo: string;
}

export class RechazarAusentismo {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private ausentismoRepo: AusentismoRepository,
        private emailNotifier: EmailNotifier,
    ) {}

    async ejecutar(input: RechazarAusentismoInput): Promise<Ausentismo> {
        const ausentismo = await this.ausentismoRepo.buscarPorId(input.ausentismoId);
        if (!ausentismo) throw new NotFoundError('Ausentismo no encontrado');

        const empleado = await this.empleadoRepo.buscarPorId(ausentismo.empleadoId);
        if (!empleado) throw new NotFoundError('Empleado no encontrado');

        if (empleado.jefeDirectoId !== input.aprobadorId) {
            throw new UnauthorizedError('No tienes permiso para rechazar este ausentismo');
        }

        try {
            ausentismo.rechazar(input.motivo);
        } catch (error) {
            throw new ValidationError(error instanceof Error ? error.message : 'No se pudo rechazar el ausentismo');
        }
        await this.ausentismoRepo.actualizar(ausentismo);

        const datosComunes = {
            empleado: empleado.nombre,
            motivo: ausentismo.motivo,
            dias: String(ausentismo.cantidadDias),
            primerDia: ausentismo.dias[0].toISOString().slice(0, 10),
            motivoRechazo: ausentismo.motivoRechazo ?? '',
        };

        if (empleado.correoPersonal) {
            await this.emailNotifier.encolar({
                tipo: 'ausentismo_rechazado_empleado',
                destinatario: empleado.correoPersonal,
                ausentismoId: ausentismo.id,
                datos: datosComunes,
            });
        }

        const correoNominas = process.env.NOMINAS_EMAIL;
        if (correoNominas) {
            await this.emailNotifier.encolar({
                tipo: 'ausentismo_rechazado_nominas',
                destinatario: correoNominas,
                ausentismoId: ausentismo.id,
                datos: datosComunes,
            });
        }

        return ausentismo;
    }
}
