import z from "zod";



export const adminLoginSchema = z.object({
    usuario: z.string().min(1).max(50),
    password: z.string().min(8).max(128)
})

export const solicitudesPorEstatusQuerySchema = z.object({
    estatus: z.enum(['pendiente', 'aprobada', 'rechazada', 'revocada']),
    pagina: z.coerce.number().int().min(1).default(1),
    porPagina: z.coerce.number().int().min(1).max(100).default(20),
})

// El reporte descarga todo de un jalón (sin paginar en la UI), por eso necesita
// un tope de porPagina mucho más alto que el de la lista paginada del panel.
export const reporteSolicitudesQuerySchema = z.object({
    estatus: z.enum(['pendiente', 'aprobada', 'rechazada', 'revocada']),
    porPagina: z.coerce.number().int().min(1).max(20000).default(10000),
})