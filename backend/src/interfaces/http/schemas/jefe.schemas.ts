import z from "zod";

export const jefeLoginSchema = z.object({
    numeroEmpleado: z.string().min(1).max(20),
    password: z.string().min(1).max(128),
});

export const crearPlanificacionSchema = z.object({
    empleadoId: z.string().uuid(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
    nota: z.string().max(280).optional(),
});
