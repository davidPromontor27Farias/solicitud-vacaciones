
import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { EmailNotifier } from "../ports/EmailNotifier";
import { IdGenerator } from "../ports/IdGenerator";
import { EnlaceAusentismoGenerator } from "../ports/EnlaceAusentismoGenerator";
import { Ausentismo, MotivoAusentismo } from "../../domain/entities/Ausentismo";
import { AusentismoRepository } from "../../domain/repositories/AusentismoRepository";
import { NotFoundError, ValidationError } from "../../shared/errors";
import { Empleado } from "../../domain/entities/Empleado";


export interface CrearAusentismoInput {
    empleadoId: string;
    motivo: MotivoAusentismo;
    comentario: string;
    dias: Date[];

}


export class CrearAusentismo {

    constructor(
        private empleadoRepo: EmpleadoRepository,
        private ausentismoRepo: AusentismoRepository,
        private emailNotifier: EmailNotifier,
        private idGenerator: IdGenerator,
        private enlaceGenerator: EnlaceAusentismoGenerator,
    ) {}


    async ejecutar(input: CrearAusentismoInput): Promise<Ausentismo>{
        const empleado = await this.empleadoRepo.buscarPorId(input.empleadoId);
        if(!empleado) throw new NotFoundError('Empleado no encontrado');

        if(!input.comentario?.trim()){
            throw new ValidationError('Debes indicar el motivo del ausentismo en el comentario');
        }

        if(input.dias.length === 0){
            throw new ValidationError('Selecciona al menos un dia')
        }

        const ausentismo = new Ausentismo({
            id: this.idGenerator.generar(),
            empleadoId: empleado.id,
            motivo: input.motivo,
            comentario: input.comentario.trim(),
            dias: input.dias,
            estatus: 'pendiente',
            motivoRechazo: null,
            createdAt: new Date(),
            resueltoAt: null
        })

        await this.ausentismoRepo.crear(ausentismo);
        await this.notificarJefeDirecto(empleado, ausentismo);
        return ausentismo;

    }

    private async notificarJefeDirecto(empleado: Empleado, ausentismo: Ausentismo): Promise<void>{
        if(!empleado.jefeDirectoId) return;

        const jefe = await this.empleadoRepo.buscarPorId(empleado.jefeDirectoId);
        if(!jefe?.correoParaSolicitudes) return;

        const enlaceToken = this.enlaceGenerator.generar({ausentismoId: ausentismo.id, jefeId: empleado.jefeDirectoId});

        await this.emailNotifier.encolar({
            tipo: 'ausentismo_creado',
            destinatario: jefe.correoParaSolicitudes,
            ausentismoId: ausentismo.id,
            datos: {
                empleado: empleado.nombre,
                motivo: ausentismo.motivo,
                comentario: ausentismo.comentario,
                dias: String(ausentismo.cantidadDias),
                primerDia: ausentismo.dias[0].toISOString().slice(0, 10),
                enlaceToken,
            }
        })
    }
}