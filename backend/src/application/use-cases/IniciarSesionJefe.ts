import { Empleado } from "../../domain/entities/Empleado";
import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { UnauthorizedError } from "../../shared/errors";

export interface IniciarSesionJefeInput {
    numeroEmpleado: string;
    password: string;
}

export interface IniciarSesionJefeResultado {
    empleado: Empleado;
    // Tiene a alguien reportandole por linea directa (Jefe Inmediato) o matricial (Jefe
    // Matricial). Se recalcula en cada login porque la estructura organizacional cambia
    // con cada reimportacion del reporte de vacaciones.
    tieneMatricial: boolean;
}

export class IniciarSesionJefe {
    constructor(private empleadoRepo: EmpleadoRepository) {}

    async ejecutar(input: IniciarSesionJefeInput): Promise<IniciarSesionJefeResultado> {
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

        // "Personal a cargo" incluye tanto la linea directa (Jefe Inmediato) como la
        // matricial (Jefe Matricial): un jefe puede tener gente reportandole solo por la
        // linea matricial, sin tener a nadie en Jefe Inmediato, y aun asi debe poder entrar.
        const todos = await this.empleadoRepo.listarTodos();
        const tieneSubordinados = todos.some(
            (e) => e.jefeDirectoId === empleado.id || e.jefeMatricialId === empleado.id,
        );
        if (!tieneSubordinados) {
            throw new UnauthorizedError('No tienes personal a tu cargo');
        }

        empleado.reiniciarIntentosFallidos();
        await this.empleadoRepo.guardar(empleado);

        return { empleado, tieneMatricial: tieneSubordinados };
    }
}
