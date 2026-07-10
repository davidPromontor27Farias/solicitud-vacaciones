import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { TokenActivacionRepository } from "../../domain/repositories/TokenActivacionRepository";
import { ValidationError, NotFoundError } from "../../shared/errors";
import { EmailNotifier } from "../ports/EmailNotifier";
import { IdGenerator } from "../ports/IdGenerator";

const HORAS_EXPIRACION_TOKEN = 1;

export interface SolicitarRestablecimientoPasswordInput {
    numeroEmpleado: string;
}

export class SolicitarRestablecimientoPassword {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private tokenRepo: TokenActivacionRepository,
        private emailNotifier: EmailNotifier,
        private idGenerator: IdGenerator,
    ) {}

    async ejecutar(input: SolicitarRestablecimientoPasswordInput): Promise<void> {
        const empleado = await this.empleadoRepo.buscarPorNumeroEmpleado(input.numeroEmpleado);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        if (!empleado.correoPersonal) {
            throw new ValidationError('Este empleado no ha activado su cuenta todavía. Usa la opción de activar cuenta.');
        }

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
            usadoAt: null,
        });

        await this.emailNotifier.encolar({
            tipo: 'restablecer_password',
            destinatario: empleado.correoPersonal,
            datos: { token: token.token, nombre: empleado.nombre },
        });
    }
}
