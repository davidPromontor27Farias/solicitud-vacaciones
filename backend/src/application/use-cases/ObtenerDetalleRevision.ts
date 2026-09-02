import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { NotFoundError, UnauthorizedError } from "../../shared/errors";

export interface DetalleRevisionInput {
    solicitudId: string;
    jefeId: string;
}

export interface DetalleRevisionResultado {
    id: string;
    empleadoNombre: string;
    estatus: string;
    dias: string[];
    backupNombre: string | null;
    colisiones: Record<string, string[]>;
    diasEquipoAprobados: Record<string, string[]>;
    diasEquipoPendientes: Record<string, string[]>;
    esJefeDirecto: boolean;
    esJefeMatricial: boolean;
}

export class ObtenerDetalleRevision {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
    ) {}

    async ejecutar(input: DetalleRevisionInput): Promise<DetalleRevisionResultado> {
        const solicitud = await this.solicitudRepo.buscarPorId(input.solicitudId);
        if (!solicitud) {
            throw new NotFoundError('Solicitud no encontrada');
        }

        const empleado = await this.empleadoRepo.buscarPorId(solicitud.empleadoId);
        if (!empleado) {
            throw new NotFoundError('Empleado no encontrado');
        }

        const esJefeDirecto = empleado.jefeDirectoId === input.jefeId;
        const esJefeMatricial = empleado.jefeMatricialId === input.jefeId;
        if (!esJefeDirecto && !esJefeMatricial) {
            throw new UnauthorizedError('No tienes permiso para revisar esta solicitud');
        }

        const dias = solicitud.dias.map((d) => d.toISOString().slice(0, 10));
        const primerDia = solicitud.dias[0];
        const ultimoDia = solicitud.dias[solicitud.dias.length - 1];

        const equipo = await this.empleadoRepo.listarEquipoDirecto(input.jefeId);
        const nombrePorId = new Map(equipo.map((e) => [e.id, e.nombre]));

        // Se amplía un mes antes y un mes después del mes de la solicitud para que el
        // calendario de revisión tenga datos aunque el jefe navegue un mes hacia
        // adelante/atrás con las flechas (esos clics no vuelven a consultar el backend).
        const rangoEquipoDesde = new Date(Date.UTC(primerDia.getUTCFullYear(), primerDia.getUTCMonth() - 1, 1));
        const rangoEquipoHasta = new Date(Date.UTC(ultimoDia.getUTCFullYear(), ultimoDia.getUTCMonth() + 2, 0));
        const rangoEquipoDesdeStr = rangoEquipoDesde.toISOString().slice(0, 10);
        const rangoEquipoHastaStr = rangoEquipoHasta.toISOString().slice(0, 10);
        const solicitudesEquipo = await this.solicitudRepo.listarPorEquipo(input.jefeId, rangoEquipoDesde, rangoEquipoHasta);

        const colisiones: Record<string, string[]> = {};
        const diasEquipoAprobados: Record<string, string[]> = {};
        const diasEquipoPendientes: Record<string, string[]> = {};
        for (const otra of solicitudesEquipo) {
            if (otra.id === solicitud.id) continue;
            if (otra.estatus !== 'aprobada' && otra.estatus !== 'pendiente') continue;

            const nombre = nombrePorId.get(otra.empleadoId) ?? 'Otro empleado';
            for (const d of otra.diasActivos.map((f) => f.toISOString().slice(0, 10))) {
                // listarPorEquipo filtra qué SOLICITUDES califican por el rango de fechas,
                // pero devuelve TODOS los días de cada una — se recorta aquí para no filtrar
                // días de meses fuera del rango consultado.
                if (d < rangoEquipoDesdeStr || d > rangoEquipoHastaStr) continue;

                if (otra.estatus === 'aprobada') {
                    diasEquipoAprobados[d] = [...(diasEquipoAprobados[d] ?? []), nombre];
                    if (dias.includes(d)) {
                        colisiones[d] = [...(colisiones[d] ?? []), nombre];
                    }
                } else {
                    diasEquipoPendientes[d] = [...(diasEquipoPendientes[d] ?? []), nombre];
                }
            }
        }

        return {
            id: solicitud.id,
            empleadoNombre: empleado.nombre,
            estatus: solicitud.estatus,
            dias,
            backupNombre: solicitud.backupNombre,
            colisiones,
            diasEquipoAprobados,
            diasEquipoPendientes,
            esJefeDirecto,
            esJefeMatricial
        };
    }
}
