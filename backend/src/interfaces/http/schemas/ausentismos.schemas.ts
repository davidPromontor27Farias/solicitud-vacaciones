import z from "zod";


export const crearAusentismoSchema = z.object({
    motivo: z.enum([

        'permiso_sin_goce', 'permiso_con_goce', 'home_office',
        'tiempo_por_tiempo', 'permiso_interno_salud', 'permiso_salida', 'permiso_entrada',
    ]),
    comentario: z.string().min(1, 'El comentario es obligatorio'),
    dias: z.array(z.string()).min(1)
});


export const rechazarAusentismoSchema = z.object({
    motivo: z.string().min(1)
});

export const historialAusentismoQuerySchema = z.object({
    pagina: z.coerce.number().int().min(1).default(1),
    porPagina: z.coerce.number().int().min(1).max(50).default(10),
});

export const ausentismosPorEstatusQuerySchema = z.object({
    estatus: z.enum(['pendiente', 'aprobado', 'rechazado']),
    pagina: z.coerce.number().int().min(1).default(1),
    porPagina: z.coerce.number().int().min(1).max(50).default(10),
});