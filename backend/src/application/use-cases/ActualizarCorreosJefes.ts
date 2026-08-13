import * as xlsx from 'xlsx';
import { EmpleadoRepository } from '../../domain/repositories/EmpleadoRepository';
import { ImportacionCorreosJefesRepository } from '../../domain/repositories/ImportacionCorreosJefesRepository';
import { ValidationError } from '../../shared/errors';
import { obtenerTexto } from '../../shared/excel';

export interface ActualizarCorreosJefesInput {
    archivoBuffer: Buffer;
    nombreArchivo: string;
    adminId: string;
}

export interface ActualizarCorreosJefesResultado {
    actualizados: number;
    noEncontrados: string[];
}

export class ActualizarCorreosJefes {
    constructor(
        private empleadoRepo: EmpleadoRepository,
        private importacionRepo: ImportacionCorreosJefesRepository,
    ) {}

    async ejecutar(input: ActualizarCorreosJefesInput): Promise<ActualizarCorreosJefesResultado> {
        const wb = xlsx.read(input.archivoBuffer, { type: 'buffer' });
        const hoja = wb.Sheets[wb.SheetNames[0]];
        if (!hoja) {
            throw new ValidationError('El archivo no contiene hojas');
        }

        const filas = xlsx.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: null });

        let actualizados = 0;
        const noEncontrados: string[] = [];

        for (const fila of filas) {
            const numeroEmpleado = obtenerTexto(fila, 'Número de empleado', 'Numero de Empleado');
            const correo = obtenerTexto(fila, 'correo');
            const nombre = obtenerTexto(fila, 'Nombre');
            if (!numeroEmpleado || !correo) continue;

            const encontrado = await this.empleadoRepo.actualizarCorreoAutorizacionPorNumeroEmpleado(numeroEmpleado, correo);
            if (encontrado) {
                actualizados++;
            } else {
                noEncontrados.push(`${numeroEmpleado} - ${nombre}`.trim());
            }
        }

        await this.importacionRepo.registrar({
            adminId: input.adminId,
            nombreArchivo: input.nombreArchivo,
            filasLeidas: filas.length,
            actualizados,
            noEncontrados,
        });

        return { actualizados, noEncontrados };
    }
}
