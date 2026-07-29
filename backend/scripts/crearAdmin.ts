import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const SALT_ROUNDS = 12;

const argumentos = process.argv.slice(2);
const ultimoEsRol = argumentos[argumentos.length - 1] === 'lectura' || argumentos[argumentos.length - 1] === 'nominas';
const rol = ultimoEsRol ? (argumentos.pop() as 'lectura' | 'nominas') : 'lectura';

const [usuario, password, ...resto] = argumentos;
const nombre = resto.join(' ');

if (!usuario || !password || !nombre) {
    console.error('Uso: npm run crear:admin -- <usuario> <password> <nombre completo> [lectura|nominas]');
    console.error('Ejemplo: npm run crear:admin -- jperez Cont2026Segura! "Juan Pérez" nominas');
    process.exit(1);
}

if (password.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const admin = await prisma.admin.upsert({
        where: { usuario },
        update: { passwordHash, nombre, rol },
        create: { usuario, passwordHash, nombre, rol },
    });

    console.log(`Admin listo: ${admin.usuario} (${admin.nombre}) — rol: ${admin.rol}`);
}

main()
    .catch((err) => {
        console.error('Error al crear admin:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
