import z from "zod";


export const verificarNumeroEmpleadoSchema = z.object({
    numeroEmpleado: z.string().min(1).max(20),
});

export const registrarCorreoSchema = z.object({
    numeroEmpleado: z.string().min(1).max(20),
    correo: z.string().email().max(254)
})


export const crearPasswordSchema = z.object({
    token: z.string().min(1).max(20),
    password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
    numeroEmpleado: z.string().min(1).max(20),
    password: z.string().min(8).max(128),
});