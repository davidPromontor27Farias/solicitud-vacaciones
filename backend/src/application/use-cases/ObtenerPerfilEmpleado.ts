import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { NotFoundError } from "../../shared/errors";

export interface PeriodoSaldoResultado {
    diasPorLey: number;
    diasDisfrutados: number;
    diasPendientes: number;
    inicioValidez: Date;
    fechaVencimiento: Date;
}

export interface PerfilEmpleadoResultado {
    nombre: string;
    numeroEmpleado: string;
    sociedad: string | null;
    puesto: string | null;
    departamento: string | null;
    correoPersonal: string | null;
    jefeDirecto: { nombre: string } | null;
    esJefe: boolean;
    saldos: PeriodoSaldoResultado[];
    totalPendientes: number;
    totalDisfrutados: number;
}

export class ObtenerPerfilEmpleado {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
    ) {}

    async ejecutar(empleadoId: string): Promise<PerfilEmpleadoResultado> {
        const empleado = await this.empleadoRepo.buscarPorId(empleadoId);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        let jefeDirecto: { nombre: string } | null = null;
        if (empleado.jefeDirectoId) {
            const jefe = await this.empleadoRepo.buscarPorId(empleado.jefeDirectoId);
            jefeDirecto = jefe ? { nombre: jefe.nombre } : null;
        }

        const saldos = await this.saldoRepo.listarPorEmpleadoId(empleado.id);
        const saldosOrdenados = [...saldos].sort((a, b) => a.inicioValidez.getTime() - b.inicioValidez.getTime());

        const equipoDirecto = await this.empleadoRepo.listarEquipoDirecto(empleado.id);

        return {
            nombre: empleado.nombre,
            numeroEmpleado: empleado.numeroEmpleado,
            sociedad: empleado.sociedad,
            puesto: empleado.puesto,
            departamento: empleado.departamento,
            correoPersonal: empleado.correoPersonal,
            jefeDirecto,
            esJefe: equipoDirecto.length > 0,
            saldos: saldosOrdenados.map((s) => ({
                diasPorLey: s.diasPorLey,
                diasDisfrutados: s.diasDisfrutados,
                diasPendientes: s.diasPendientes,
                inicioValidez: s.inicioValidez,
                fechaVencimiento: s.fechaVencimiento,
            })),
            totalPendientes: saldos.reduce((acc, s) => acc + s.diasPendientes, 0),
            totalDisfrutados: saldos.reduce((acc, s) => acc + s.diasDisfrutados, 0),
        };
    }
}
