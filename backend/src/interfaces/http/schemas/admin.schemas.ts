import z from "zod";



export const adminLoginSchema = z.object({
    usuario: z.string().min(1).max(50),
    password: z.string().min(8).max(128)
})