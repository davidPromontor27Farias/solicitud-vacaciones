import 'dotenv/config';
import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';

const RUTA_EXCEL = process.argv[2] ?? 'C:\\Users\\sistemas\\Downloads\\Jefes.xlsx';
const HOJA = 'Jefes';

const prisma = new PrismaClient();

const DIACRITICOS = /[̀-ͯ]/g;

function normalizarEncabezado(texto: string): string {
    return texto.normalize('NFD').replace(DIACRITICOS, '').trim().toLowerCase();
}

function obtenerCampo(fila: Record<string, unknown>, ...alias: string[]): string {
    const aliasNormalizados = alias.map(normalizarEncabezado);
    for (const [clave, valor] of Object.entries(fila)) {
        if (aliasNormalizados.includes(normalizarEncabezado(clave)) && valor != null) {
            return String(valor).trim();
        }
    }
    return '';
}

async function main() {
    const wb = xlsx.readFile(RUTA_EXCEL);
    const sheet = wb.Sheets[HOJA];
    if (!sheet) {
        throw new Error(`No se encontró la hoja "${HOJA}" en ${RUTA_EXCEL}`);
    }
    const filas = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

    console.log(`Filas leídas: ${filas.length}`);

    let actualizados = 0;
    const noEncontrados: string[] = [];

    for (const fila of filas) {
        const numeroEmpleado = obtenerCampo(fila, 'Número de empleado', 'Numero de Empleado');
        const correo = obtenerCampo(fila, 'correo');
        const nombre = obtenerCampo(fila, 'Nombre');
        if (!numeroEmpleado || !correo) continue;

        const empleado = await prisma.empleado.findUnique({ where: { numeroEmpleado } });
        if (!empleado) {
            noEncontrados.push(`${numeroEmpleado} - ${nombre}`);
            continue;
        }

        await prisma.empleado.update({
            where: { numeroEmpleado },
            data: { correoAutorizacion: correo },
        });
        actualizados++;
    }

    console.log(`Jefes actualizados con correo de autorizacion: ${actualizados}`);
    if (noEncontrados.length > 0) {
        console.log('No encontrados en la base de datos:', noEncontrados);
    }
}

main()
    .catch((error) => {
        console.error('Error en la importación:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
