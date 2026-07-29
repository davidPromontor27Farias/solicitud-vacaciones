import { z } from 'zod';

export const crearSolicitudSchema = z.object({
    dias: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido')).min(1),
    backupNombre: z.string().min(1).max(150)
});

export const aprobarSolicitudSchema = z.object({});

export const revocarSolicitudSchema = z.object({
    motivo: z.string().min(1).max(300)
});

export const rechazarSolicitudSchema = z.object({
    motivo: z.string().min(1).max(300)
});

export const historialEmpleadoQuerySchema = z.object({
    pagina: z.coerce.number().int().min(1).default(1),
    porPagina: z.coerce.number().int().min(1).max(50).default(10),
});

export const historialEquipoQuerySchema = z.object({
    desde: z.coerce.date().optional(),
    hasta: z.coerce.date().optional(),
});
