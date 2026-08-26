import * as xlsx from 'xlsx';
import { EmpleadoRepository } from '../../domain/repositories/EmpleadoRepository';
import { SaldoVacacionesRepository } from '../../domain/repositories/SaldoVacacionesRepository';
import { ImportacionNominaRepository } from '../../domain/repositories/ImportacionNominaRepository';
import { SaldoVacaciones } from '../../domain/entities/SaldoVacaciones';
import { IdGenerator } from '../ports/IdGenerator';
import { ValidationError } from '../../shared/errors';
import { normalizarEncabezado, obtenerTexto, obtenerNumero, obtenerFecha } from '../../shared/excel';

export interface ImportarReporteVacacionesInput {
    archivoBuffer: Buffer;
    nombreArchivo: string;
    adminId: string;
}

export interface ImportarReporteVacacionesResultado {
    filasLeidas: number;
    empleadosCreados: number;
    empleadosActualizados: number;
    periodosCreados: number;
    periodosActualizados: number;
    periodosEliminados: number;
    jefesNoResueltos: string[];
    filasInvalidas: string[];
}

interface FilaValida {
    numeroEmpleado: string;
    nombre: string;
    sociedad: string | null;
    puesto: string | null;
    departamento: string | null;
    backupNombre: string | null;
    jefeInmediato: string | null;
    jefeMatricial: string | null;
    diasPorLey: number;
    diasDisfrutadosSap: number;
    inicioValidez: Date;
    finValidez: Date;
    fechaVencimiento: Date;
    fechaLimiteDisfrute: Date;
}

export class ImportarReporteVacaciones {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private saldoRepo: SaldoVacacionesRepository,
        private importacionRepo: ImportacionNominaRepository,
        private idGenerator: IdGenerator,
    ) {}

    async ejecutar(input: ImportarReporteVacacionesInput): Promise<ImportarReporteVacacionesResultado> {
        const wb = xlsx.read(input.archivoBuffer, { type: 'buffer', cellDates: true });
        const hoja = wb.Sheets[wb.SheetNames[0]];
        if (!hoja) {
            throw new ValidationError('El archivo no contiene hojas');
        }

        const filasCrudas = xlsx.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: null });
        const { validas, invalidas } = this.parsearFilas(filasCrudas);

        const porEmpleado = new Map<string, FilaValida[]>();
        for (const fila of validas) {
            const lista = porEmpleado.get(fila.numeroEmpleado) ?? [];
            lista.push(fila);
            porEmpleado.set(fila.numeroEmpleado, lista);
        }

        let empleadosCreados = 0;
        let empleadosActualizados = 0;
        for (const [numeroEmpleado, periodos] of porEmpleado) {
            const base = periodos[0];
            const { esNuevo } = await this.empleadoRepo.upsertDesdeImportacion({
                numeroEmpleado,
                nombre: base.nombre,
                sociedad: base.sociedad,
                puesto: base.puesto,
                departamento: base.departamento,
                backupNombre: base.backupNombre,
            });
            if (esNuevo) empleadosCreados++;
            else empleadosActualizados++;
        }

        const jefesNoResueltos = await this.resolverJefes(porEmpleado);

        let periodosCreados = 0;
        let periodosActualizados = 0;
        let periodosEliminados = 0;
        for (const [numeroEmpleado, periodos] of porEmpleado) {
            const empleado = await this.empleadoRepo.buscarPorNumeroEmpleado(numeroEmpleado);
            if (!empleado) continue;

            const saldosExistentes = await this.saldoRepo.listarPorEmpleadoId(empleado.id);
            // Un periodo se identifica por inicioValidez + fechaLimiteDisfrute: SAP puede reportar
            // dos tramos con la misma vigencia pero contingentes que vencen en fechas distintas.
            const clavePeriodo = (inicioValidez: Date, fechaLimiteDisfrute: Date) =>
                `${inicioValidez.getTime()}_${fechaLimiteDisfrute.getTime()}`;
            const periodosEnArchivo = new Set(periodos.map((p) => clavePeriodo(p.inicioValidez, p.fechaLimiteDisfrute)));

            for (const periodo of periodos) {
                const existente = saldosExistentes.find(
                    (s) => clavePeriodo(s.inicioValidez, s.fechaLimiteDisfrute) === clavePeriodo(periodo.inicioValidez, periodo.fechaLimiteDisfrute),
                );

                if (existente) {
                    existente.reconciliarDesdeSap({
                        diasPorLey: periodo.diasPorLey,
                        diasDisfrutadosSap: periodo.diasDisfrutadosSap,
                        fechaVencimiento: periodo.fechaVencimiento,
                        finValidez: periodo.finValidez,
                        fechaLimiteDisfrute: periodo.fechaLimiteDisfrute,
                    });
                    await this.saldoRepo.guardar(existente);
                    periodosActualizados++;
                } else {
                    const nuevo = new SaldoVacaciones({
                        id: this.idGenerator.generar(),
                        empleadoId: empleado.id,
                        diasPorLey: periodo.diasPorLey,
                        diasDisfrutados: periodo.diasDisfrutadosSap,
                        diasPendientes: Math.max(periodo.diasPorLey - periodo.diasDisfrutadosSap, 0),
                        inicioValidez: periodo.inicioValidez,
                        finValidez: periodo.finValidez,
                        fechaVencimiento: periodo.fechaVencimiento,
                        fechaLimiteDisfrute: periodo.fechaLimiteDisfrute,
                    });
                    await this.saldoRepo.crear(nuevo);
                    saldosExistentes.push(nuevo); // por si el archivo trae el mismo periodo repetido en otra fila
                    periodosCreados++;
                }
            }

            // Periodos que ya no aparecen en el archivo para este empleado: SAP ya no los reporta
            // (se corrigieron/eliminaron ahí), así que se eliminan también aquí.
            for (const saldo of saldosExistentes) {
                if (!periodosEnArchivo.has(clavePeriodo(saldo.inicioValidez, saldo.fechaLimiteDisfrute))) {
                    await this.saldoRepo.eliminar(saldo.id);
                    periodosEliminados++;
                }
            }
        }

        const resultado: ImportarReporteVacacionesResultado = {
            filasLeidas: filasCrudas.length,
            empleadosCreados,
            empleadosActualizados,
            periodosCreados,
            periodosActualizados,
            periodosEliminados,
            jefesNoResueltos,
            filasInvalidas: invalidas,
        };

        await this.importacionRepo.registrar({
            adminId: input.adminId,
            nombreArchivo: input.nombreArchivo,
            filasLeidas: resultado.filasLeidas,
            empleadosCreados,
            empleadosActualizados,
            periodosCreados,
            periodosActualizados,
            periodosEliminados,
            jefesNoResueltos,
        });

        return resultado;
    }

    private parsearFilas(filas: Record<string, unknown>[]): { validas: FilaValida[]; invalidas: string[] } {
        const validas: FilaValida[] = [];
        const invalidas: string[] = [];

        filas.forEach((fila, indice) => {
            const numeroEmpleado = obtenerTexto(fila, 'No', 'Número de empleado', 'Numero de Empleado');
            const nombre = obtenerTexto(fila, 'Nombre');
            const diasPorLey = obtenerNumero(fila, 'Cantidad contingente');
            const diasDisfrutadosSap = obtenerNumero(fila, 'Liq.contingentes');
            const inicioValidez = obtenerFecha(fila, 'Inicio de validez');
            const finValidez = obtenerFecha(fila, 'Fin de validez');
            const fechaVencimiento = obtenerFecha(fila, 'Inicio liquidación', 'Inicio liquidacion');
            const fechaLimiteDisfrute = obtenerFecha(fila, 'Fecha Limite para Disfrutar', 'Fecha Limite para disfrutar');

            if (!numeroEmpleado || !nombre || diasPorLey == null || diasDisfrutadosSap == null
                || !inicioValidez || !finValidez || !fechaVencimiento || !fechaLimiteDisfrute) {
                invalidas.push(`Fila ${indice + 2}: ${numeroEmpleado || '(sin número)'} - ${nombre || '(sin nombre)'} - faltan columnas requeridas o tienen formato inválido`);
                return;
            }

            validas.push({
                numeroEmpleado,
                nombre,
                sociedad: obtenerTexto(fila, 'Sociedad') || null,
                puesto: obtenerTexto(fila, 'Puesto') || null,
                departamento: obtenerTexto(fila, 'Departamento') || null,
                backupNombre: obtenerTexto(fila, 'BACK UP', 'BACKUP') || null,
                jefeInmediato: obtenerTexto(fila, 'JEFE INMEDIATO') || null,
                jefeMatricial: obtenerTexto(fila, 'JEFE MATRICIAL') || null,
                diasPorLey,
                diasDisfrutadosSap,
                inicioValidez,
                finValidez,
                fechaVencimiento,
                fechaLimiteDisfrute,
            });
        });

        return { validas, invalidas };
    }

    private async resolverJefes(porEmpleado: Map<string, FilaValida[]>): Promise<string[]> {
        const todosEmpleados = await this.empleadoRepo.listarTodos();
        const idPorNombre = new Map(todosEmpleados.map((e) => [normalizarEncabezado(e.nombre), e.id]));

        const jefesNoResueltos = new Set<string>();

        for (const [numeroEmpleado, periodos] of porEmpleado) {
            const base = periodos[0];
            const datos: { jefeDirectoId?: string | null; jefeMatricialId?: string | null } = {};

            if (base.jefeInmediato) {
                const id = idPorNombre.get(normalizarEncabezado(base.jefeInmediato));
                if (id) datos.jefeDirectoId = id;
                else jefesNoResueltos.add(base.jefeInmediato);
            }

            if (base.jefeMatricial) {
                const id = idPorNombre.get(normalizarEncabezado(base.jefeMatricial));
                if (id) datos.jefeMatricialId = id;
                else jefesNoResueltos.add(base.jefeMatricial);
            }

            if (Object.keys(datos).length > 0) {
                await this.empleadoRepo.actualizarJefes(numeroEmpleado, datos);
            }
        }

        return [...jefesNoResueltos];
    }
}
