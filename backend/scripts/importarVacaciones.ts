import 'dotenv/config';
import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';

const RUTA_EXCEL = process.argv[2] ?? 'C:\\Users\\sistemas\\Downloads\\BaseVacaciones.xlsx';
const HOJA = 'Vacaciones';

const prisma = new PrismaClient();

interface FilaExcel {
    No: number;
    Nombre: string;
    Sociedad: string | null;
    Status: string | null;
    Puesto: string | null;
    Departamento: string | null;
    'Inicio de validez': Date;
    'Fin de validez': Date;
    'Dias por ley': number;
    'Ya disfrutados': number;
    'Dias pendientes': number;
    Vencen: Date;
    'Fecha Limite para disfrutar': Date;
    'JEFE INMEDIATO': string | null;
    'JEFE MATRICIAL': string | null;
    'BACK UP': string | null;
}

async function main() {
    const wb = xlsx.readFile(RUTA_EXCEL, { cellDates: true });
    const sheet = wb.Sheets[HOJA];
    if (!sheet) {
        throw new Error(`No se encontró la hoja "${HOJA}" en ${RUTA_EXCEL}`);
    }
    const filas = xlsx.utils.sheet_to_json<FilaExcel>(sheet, { defval: null });

    const porEmpleado = new Map<number, FilaExcel[]>();
    for (const fila of filas) {
        const lista = porEmpleado.get(fila.No) ?? [];
        lista.push(fila);
        porEmpleado.set(fila.No, lista);
    }

    console.log(`Filas leídas: ${filas.length} | Empleados únicos: ${porEmpleado.size}`);

    // Paso 1: upsert de empleados (sin jefes todavía)
    let empleadosCreados = 0;
    let empleadosActualizados = 0;
    for (const [no, periodos] of porEmpleado) {
        const base = periodos[0];
        const numeroEmpleado = String(no);
        const existente = await prisma.empleado.findUnique({ where: { numeroEmpleado } });

        await prisma.empleado.upsert({
            where: { numeroEmpleado },
            create: {
                numeroEmpleado,
                nombre: base.Nombre,
                sociedad: base.Sociedad,
                puesto: base.Puesto,
                departamento: base.Departamento,
                backupNombre: base['BACK UP'] ?? null,
                primerAcceso: true,
                intentosFallidos: 0,
                recibeNotificacionesMatricial: true,
            },
            update: {
                nombre: base.Nombre,
                sociedad: base.Sociedad,
                puesto: base.Puesto,
                departamento: base.Departamento,
                backupNombre: base['BACK UP'] ?? null,
            },
        });

        if (existente) empleadosActualizados++;
        else empleadosCreados++;
    }
    console.log(`Empleados creados: ${empleadosCreados} | actualizados: ${empleadosActualizados}`);

    // Paso 2: resolver jefe directo / jefe matricial por nombre
    const todosEmpleados = await prisma.empleado.findMany({ select: { id: true, numeroEmpleado: true, nombre: true } });
    const idPorNombre = new Map(todosEmpleados.map((e) => [e.nombre, e.id]));

    const jefesNoEncontrados = new Set<string>();
    let jefesResueltos = 0;

    for (const [no, periodos] of porEmpleado) {
        const base = periodos[0];
        const numeroEmpleado = String(no);
        const jefeDirectoId = base['JEFE INMEDIATO'] ? idPorNombre.get(base['JEFE INMEDIATO']) ?? null : null;
        const jefeMatricialId = base['JEFE MATRICIAL'] ? idPorNombre.get(base['JEFE MATRICIAL']) ?? null : null;

        if (base['JEFE INMEDIATO'] && !jefeDirectoId) jefesNoEncontrados.add(base['JEFE INMEDIATO']);
        if (base['JEFE MATRICIAL'] && !jefeMatricialId) jefesNoEncontrados.add(base['JEFE MATRICIAL']);
        if (jefeDirectoId || jefeMatricialId) jefesResueltos++;

        await prisma.empleado.update({
            where: { numeroEmpleado },
            data: { jefeDirectoId, jefeMatricialId },
        });
    }
    console.log(`Empleados con al menos un jefe resuelto: ${jefesResueltos}`);
    if (jefesNoEncontrados.size > 0) {
        console.log('Nombres de jefe sin match como empleado:', [...jefesNoEncontrados]);
    }

    // Paso 3: crear/actualizar periodos de saldo de vacaciones
    for (const [no, periodos] of porEmpleado) {
        const numeroEmpleado = String(no);
        const empleado = await prisma.empleado.findUnique({ where: { numeroEmpleado } });
        if (!empleado) continue;

        for (const periodo of periodos) {
            await prisma.saldoVacaciones.upsert({
                where: {
                    empleadoId_inicioValidez: {
                        empleadoId: empleado.id,
                        inicioValidez: periodo['Inicio de validez'],
                    },
                },
                create: {
                    empleadoId: empleado.id,
                    diasPorLey: periodo['Dias por ley'],
                    diasDisfrutados: periodo['Ya disfrutados'],
                    diasPendientes: periodo['Dias pendientes'],
                    inicioValidez: periodo['Inicio de validez'],
                    finValidez: periodo['Fin de validez'],
                    fechaVencimiento: periodo.Vencen,
                    fechaLimiteDisfrute: periodo['Fecha Limite para disfrutar'],
                },
                update: {
                    diasPorLey: periodo['Dias por ley'],
                    diasDisfrutados: periodo['Ya disfrutados'],
                    diasPendientes: periodo['Dias pendientes'],
                    finValidez: periodo['Fin de validez'],
                    fechaVencimiento: periodo.Vencen,
                    fechaLimiteDisfrute: periodo['Fecha Limite para disfrutar'],
                },
            });
        }
    }
    const totalSaldos = await prisma.saldoVacaciones.count();
    console.log(`Total de periodos de saldo en la base de datos: ${totalSaldos}`);
}

main()
    .catch((error) => {
        console.error('Error en la importación:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
