import z from "zod";


export const verificarNumeroEmpleadoSchema = z.object({
    numeroEmpleado: z.string().min(1),
});

export const registrarCorreoSchema = z.object({
    numeroEmpleado: z.string().min(1),
    correo: z.string().email(),
})


export const crearPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8),
});

export const loginSchema = z.object({
    numeroEmpleado: z.string().min(1),
    password: z.string().min(1),
});