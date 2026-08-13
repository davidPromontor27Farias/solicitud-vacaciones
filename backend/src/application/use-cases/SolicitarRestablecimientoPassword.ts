import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { TokenActivacionRepository } from "../../domain/repositories/TokenActivacionRepository";
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
        // No se revela si el número de empleado existe ni si ya activó su cuenta:
        // la respuesta al cliente es la misma en todos los casos (evita enumeración de empleados).
        if (!empleado || !empleado.correoPersonal) {
            return;
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
