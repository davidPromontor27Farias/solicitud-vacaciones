import z from "zod";

export const jefeLoginSchema = z.object({
    numeroEmpleado: z.string().min(1).max(20),
    password: z.string().min(1).max(128),
});

export const revocarVacacionesJefeSchema = z.object({
    motivo: z.string().min(1).max(300),
    // Si se omite, se revoca el periodo activo completo. Si se especifica, solo esos dias.
    dias: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido')).min(1).optional(),
});
