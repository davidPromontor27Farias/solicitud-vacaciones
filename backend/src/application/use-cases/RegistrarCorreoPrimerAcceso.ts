import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { TokenActivacionRepository } from "../../domain/repositories/TokenActivacionRepository";
import { ConflictError, NotFoundError } from "../../shared/errors";
import { EmailNotifier } from "../ports/EmailNotifier";
import { IdGenerator } from "../ports/IdGenerator";


const HORAS_EXPIRACION_TOKEN = 24;

export interface registrarCorreoPrimerAccesoInput {
    numeroEmpleado: string;
    correo: string;

}

export class registrarCorreoPrimerAcceso {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private tokenRepo: TokenActivacionRepository,
        private emailNotifier: EmailNotifier,
        private idGenerator: IdGenerator
    ) {}

    async ejecutar(input: registrarCorreoPrimerAccesoInput): Promise<void>{
        const empleado = await this.empleadoRepo.buscarPorNumeroEmpleado(input.numeroEmpleado);
        if(!empleado){
            throw new NotFoundError('Empleado no encontrado');
        }

        if(!empleado.primerAcceso){
            throw new ConflictError('Este empleado ya tiene una cuenta activa');
        }

        empleado.registrarCorreo(input.correo);
        await this.empleadoRepo.guardar(empleado);

        const expiraAt = new Date();
        expiraAt.setHours(expiraAt.getHours() + HORAS_EXPIRACION_TOKEN);

        let codigo: string;
        let colisionExistente;
        do {
            codigo = this.idGenerator.generarCodigoActivacion();
            colisionExistente = await this.tokenRepo.buscarPorToken(codigo);
        } while (colisionExistente);

        const token = await this.tokenRepo.crear({
            empleadoId: empleado.id,
            token: codigo,
            expiraAt,
            usadoAt: null
        });

        await this.emailNotifier.encolar({
            tipo: 'activacion_cuenta',
            destinatario: input.correo,
            datos: {token: token.token, nombre: empleado.nombre}
        })
    }


}