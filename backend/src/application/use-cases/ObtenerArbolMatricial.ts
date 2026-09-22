import { Empleado } from "../../domain/entities/Empleado";
import { EmpleadoRepository } from "../../domain/repositories/EmpleadoRepository";
import { SaldoVacacionesRepository } from "../../domain/repositories/SaldoVacacionesRepository";
import { SolicitudVacacionesRepository } from "../../domain/repositories/SolicitudVacacionesRepository";
import { calcularConsumoSaldo, calcularDiasPasadosYFuturos } from "../../domain/services/consumoSaldo";

export type EstadoNodo = 'vencido' | 'critico' | 'vigente' | 'sin_datos';

export interface NodoArbolMatricial {
    empleadoId: string;
    numeroEmpleado: string;
    nombre: string;
    puesto: string | null;
    departamento: string | null;
    estado: EstadoNodo;
    diasPendientes: number;
    fechaLimiteDisfrute: Date | null;
    hijos: NodoArbolMatricial[];
}

const ORDEN_URGENCIA: EstadoNodo[] = ['vencido', 'critico', 'vigente'];

// La linea directa (Jefe Inmediato) manda sobre la posicion en el arbol: un empleado
// cuelga de su jefe directo cuando lo tiene. El Jefe Matricial solo se usa como
// respaldo cuando el empleado no tiene jefe directo (reporta unicamente por linea
// matricial), para no duplicarlo un nivel mas arriba de donde realmente esta.
function construirHijosPorJefeId(empleados: Empleado[]): Map<string, Empleado[]> {
    const mapa = new Map<string, Empleado[]>();
    const agregar = (jefeId: string, hijo: Empleado) => {
        const lista = mapa.get(jefeId) ?? [];
        lista.push(hijo);
        mapa.set(jefeId, lista);
    };
    for (const empleado of empleados) {
        if (empleado.jefeDirectoId) {
            agregar(empleado.jefeDirectoId, empleado);
        } else if (empleado.jefeMatricialId) {
            agregar(empleado.jefeMatricialId, empleado);
        }
    }
    return mapa;
}

export class ObtenerArbolMatricial {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
        private solicitudRepo: SolicitudVacacionesRepository,
    ) {}

    async ejecutar(jefeId: string, fechaReferencia: Date = new Date()): Promise<NodoArbolMatricial | null> {
        const [todos, saldos, aprobadas] = await Promise.all([
            this.empleadoRepo.listarTodos(),
            this.saldoRepo.listarTodos(),
            this.solicitudRepo.listarAprobadasTodas(),
        ]);

        const jefe = todos.find((e) => e.id === jefeId);
        if (!jefe) return null;

        const hijosPorJefeId = construirHijosPorJefeId(todos);

        const saldosPorEmpleadoId = new Map<string, typeof saldos>();
        for (const saldo of saldos) {
            const lista = saldosPorEmpleadoId.get(saldo.empleadoId) ?? [];
            lista.push(saldo);
            saldosPorEmpleadoId.set(saldo.empleadoId, lista);
        }

        const aprobadasPorEmpleadoId = new Map<string, typeof aprobadas>();
        for (const solicitud of aprobadas) {
            const lista = aprobadasPorEmpleadoId.get(solicitud.empleadoId) ?? [];
            lista.push(solicitud);
            aprobadasPorEmpleadoId.set(solicitud.empleadoId, lista);
        }

        const resumenDe = (empleado: Empleado) => {
            const saldosDelEmpleado = saldosPorEmpleadoId.get(empleado.id) ?? [];
            const aprobadasDelEmpleado = aprobadasPorEmpleadoId.get(empleado.id) ?? [];
            const { pasados, futuros } = calcularDiasPasadosYFuturos(saldosDelEmpleado, aprobadasDelEmpleado, fechaReferencia);

            let estado: EstadoNodo = 'sin_datos';
            let diasPendientes = 0;
            let fechaLimiteDisfrute: Date | null = null;

            for (const saldo of saldosDelEmpleado) {
                const estadoSaldo: EstadoNodo = saldo.estaVencido(fechaReferencia)
                    ? 'vencido'
                    : saldo.estaCritico(fechaReferencia)
                        ? 'critico'
                        : 'vigente';
                if (estado === 'sin_datos' || ORDEN_URGENCIA.indexOf(estadoSaldo) < ORDEN_URGENCIA.indexOf(estado)) {
                    estado = estadoSaldo;
                    diasPendientes = calcularConsumoSaldo(saldo, pasados.get(saldo.id) ?? 0, futuros.get(saldo.id) ?? 0).diasPendientes;
                    fechaLimiteDisfrute = saldo.fechaLimiteDisfrute;
                }
            }
            return { estado, diasPendientes, fechaLimiteDisfrute };
        };

        // Recorrido en cascada estrictamente hacia abajo (jefe -> hijos -> nietos...): el
        // set de visitados evita ciclos y garantiza que cada empleado aparezca una sola
        // vez en el arbol, aunque sea alcanzable por linea directa y matricial a la vez.
        const visitados = new Set<string>([jefe.id]);
        const construirNodo = (empleado: Empleado): NodoArbolMatricial => {
            const hijosSinVisitar = (hijosPorJefeId.get(empleado.id) ?? []).filter((hijo) => {
                if (visitados.has(hijo.id)) return false;
                visitados.add(hijo.id);
                return true;
            });

            return {
                empleadoId: empleado.id,
                numeroEmpleado: empleado.numeroEmpleado,
                nombre: empleado.nombre,
                puesto: empleado.puesto,
                departamento: empleado.departamento,
                ...resumenDe(empleado),
                hijos: hijosSinVisitar.map(construirNodo),
            };
        };

        return construirNodo(jefe);
    }
}
