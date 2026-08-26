import { Empleado } from "../../domain/entities/Empleado";
import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { UnauthorizedError } from "../../shared/errors";

export interface IniciarSesionJefeInput {
    numeroEmpleado: string;
    password: string;
}

export class IniciarSesionJefe {
    constructor(private empleadoRepo: EmpleadoRepository) {}

    async ejecutar(input: IniciarSesionJefeInput): Promise<Empleado> {
        const empleado = await this.empleadoRepo.buscarPorNumeroEmpleado(input.numeroEmpleado);
        if (!empleado) {
            throw new UnauthorizedError('Credenciales invalidas');
        }

        // Mismo bloqueo por intentos fallidos que el resto de los logins: la contraseña
        // aqui es generica y compartida por todos los jefes, asi que limitar intentos
        // por numero de empleado es la unica proteccion contra fuerza bruta.
        if (empleado.estaBloqueado()) {
            throw new UnauthorizedError('Cuenta bloqueada temporalmente por intentos fallidos, intenta mas tarde');
        }

        if (input.password !== process.env.PASSWORD_JEFE_DIRECTO) {
            empleado.registrarIntentoFallido();
            await this.empleadoRepo.guardar(empleado);
            throw new UnauthorizedError('Credenciales invalidas');
        }

        const equipo = await this.empleadoRepo.listarEquipoDirecto(empleado.id);
        if (equipo.length === 0) {
            throw new UnauthorizedError('No tienes personal a tu cargo');
        }

        empleado.reiniciarIntentosFallidos();
        await this.empleadoRepo.guardar(empleado);

        return empleado;
    }
}
