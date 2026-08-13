import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { NotFoundError } from "../../shared/errors";

export interface SaldoDetalleResultado {
    id: string;
    diasPorLey: number;
    diasDisfrutados: number;
    diasPendientes: number;
    inicioValidez: Date;
    fechaVencimiento: Date;
    diasParaVencer: number;
    estado: 'vencido' | 'critico' | 'vigente';
}

export interface DetalleEmpleadoAdminResultado {
    id: string;
    numeroEmpleado: string;
    nombre: string;
    sociedad: string | null;
    puesto: string | null;
    departamento: string | null;
    correoPersonal: string | null;
    jefeDirecto: { nombre: string } | null;
    jefeMatricial: { nombre: string } | null;
    saldos: SaldoDetalleResultado[];
}

export class ObtenerDetalleEmpleadoAdmin {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
    ) {}

    async ejecutar(input: { empleadoId: string }, fechaReferencia: Date = new Date()): Promise<DetalleEmpleadoAdminResultado> {
        const empleado = await this.empleadoRepo.buscarPorId(input.empleadoId);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        const [jefeDirecto, jefeMatricial, saldos] = await Promise.all([
            empleado.jefeDirectoId ? this.empleadoRepo.buscarPorId(empleado.jefeDirectoId) : Promise.resolve(null),
            empleado.jefeMatricialId ? this.empleadoRepo.buscarPorId(empleado.jefeMatricialId) : Promise.resolve(null),
            this.saldoRepo.listarPorEmpleadoId(empleado.id),
        ]);

        const saldosOrdenados = [...saldos].sort((a, b) => a.fechaLimiteDisfrute.getTime() - b.fechaLimiteDisfrute.getTime());

        return {
            id: empleado.id,
            numeroEmpleado: empleado.numeroEmpleado,
            nombre: empleado.nombre,
            sociedad: empleado.sociedad,
            puesto: empleado.puesto,
            departamento: empleado.departamento,
            correoPersonal: empleado.correoPersonal,
            jefeDirecto: jefeDirecto ? { nombre: jefeDirecto.nombre } : null,
            jefeMatricial: jefeMatricial ? { nombre: jefeMatricial.nombre } : null,
            saldos: saldosOrdenados.map((saldo) => {
                const diasParaVencer = saldo.diasPorVencer(fechaReferencia);
                const estado: SaldoDetalleResultado['estado'] = saldo.estaVencido(fechaReferencia)
                    ? 'vencido'
                    : saldo.estaCritico(fechaReferencia)
                        ? 'critico'
                        : 'vigente';
                return {
                    id: saldo.id,
                    diasPorLey: saldo.diasPorLey,
                    diasDisfrutados: saldo.diasDisfrutados,
                    diasPendientes: saldo.diasPendientes,
                    inicioValidez: saldo.inicioValidez,
                    // fechaLimiteDisfrute (no fechaVencimiento) para que la fecha mostrada
                    // coincida con la que usa estaVencido()/diasPorVencer() al clasificar el estado.
                    fechaVencimiento: saldo.fechaLimiteDisfrute,
                    diasParaVencer,
                    estado,
                };
            }),
        };
    }
}
