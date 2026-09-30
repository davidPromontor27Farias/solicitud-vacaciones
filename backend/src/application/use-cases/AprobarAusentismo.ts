import { Empleado } from "../../domain/entities/Empleado";
import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { AusentismoRepository } from "../../domain/repositories/AusentismoRepository";
import { Ausentismo } from "../../domain/entities/Ausentismo";
import { EmailNotifier } from "../ports/EmailNotifier";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors";

export interface AprobarAusentismoInput {
    ausentismoId: string;
    aprobadorId: string;
}

export class AprobarAusentismo {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private ausentismoRepo: AusentismoRepository,
        private emailNotifier: EmailNotifier,
    ) {}

    async ejecutar(input: AprobarAusentismoInput): Promise<Ausentismo> {
        const ausentismo = await this.ausentismoRepo.buscarPorId(input.ausentismoId);
        if (!ausentismo) throw new NotFoundError('Ausentismo no encontrado');

        const empleado = await this.empleadoRepo.buscarPorId(ausentismo.empleadoId);
        if (!empleado) throw new NotFoundError('Empleado no encontrado');
        
        if (empleado.jefeDirectoId !== input.aprobadorId) {
            throw new UnauthorizedError('No tienes permiso para aprobar este ausentismo');
        }

        try {
            ausentismo.aprobar();
        } catch (error) {
            throw new ValidationError(error instanceof Error ? error.message : 'No se pudo aprobar el ausentismo');
        }
        await this.ausentismoRepo.actualizar(ausentismo);
        await this.notificar(empleado, ausentismo);
        return ausentismo;
    }

    private async notificar(empleado: Empleado, ausentismo: Ausentismo): Promise<void> {
        const datosComunes = {
            empleado: empleado.nombre,
            motivo: ausentismo.motivo,
            dias: String(ausentismo.cantidadDias),
            primerDia: ausentismo.dias[0].toISOString().slice(0, 10),
        }

        if (empleado.correoPersonal) {
            await this.emailNotifier.encolar({
                tipo: 'ausentismo_aprobado_empleado',
                destinatario: empleado.correoPersonal,
                ausentismoId: ausentismo.id,
                datos: datosComunes,
            });
        }

        const correoNominas = process.env.NOMINAS_EMAIL;
        if (correoNominas) {
            await this.emailNotifier.encolar({
                tipo: 'ausentismo_aprobado_nominas',
                destinatario: correoNominas,
                ausentismoId: ausentismo.id,
                datos: datosComunes,
            });
        }
    }
}