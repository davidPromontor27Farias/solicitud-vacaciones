import { createHmac, timingSafeEqual } from 'node:crypto';
import { EnlaceRevisionGenerator, PayloadEnlaceRevision } from '../../application/ports/EnlaceRevisionGenerator';

const DURACION_MS = 7 * 24 * 60 * 60 * 1000;

interface CuerpoEnlace extends PayloadEnlaceRevision {
    exp: number;
}

function firmar(datos: string, secreto: string): string {
    return createHmac('sha256', secreto).update(datos).digest('base64url');
}

function firmasCoinciden(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}

export class JwtEnlaceRevisionGenerator implements EnlaceRevisionGenerator {
    constructor(private secreto: string) {}

    generar(payload: PayloadEnlaceRevision): string {
        const cuerpo: CuerpoEnlace = { ...payload, exp: Date.now() + DURACION_MS };
        const datos = Buffer.from(JSON.stringify(cuerpo)).toString('base64url');
        const firma = firmar(datos, this.secreto);
        return `${datos}.${firma}`;
    }

    verificar(token: string): PayloadEnlaceRevision | null {
        const [datos, firma] = token.split('.');
        if (!datos || !firma) return null;
        if (!firmasCoinciden(firmar(datos, this.secreto), firma)) return null;

        try {
            const cuerpo = JSON.parse(Buffer.from(datos, 'base64url').toString('utf8')) as CuerpoEnlace;
            if (typeof cuerpo.exp !== 'number' || cuerpo.exp < Date.now()) return null;
            if (typeof cuerpo.solicitudId !== 'string' || typeof cuerpo.jefeId !== 'string') return null;
            return { solicitudId: cuerpo.solicitudId, jefeId: cuerpo.jefeId };
        } catch {
            return null;
        }
    }
}
