import { createHmac, timingSafeEqual } from 'node:crypto';
import { EnlaceAusentismoGenerator, PayloadEnlaceAusentismo } from '../../application/ports/EnlaceAusentismoGenerator';

const DURACION_MS = 7 * 24 * 60 * 60 * 1000;

interface CuerpoEnlace extends PayloadEnlaceAusentismo {
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

export class JwtEnlaceAusentismoGenerator implements EnlaceAusentismoGenerator {
    constructor(private secreto: string) {}

    generar(payload: PayloadEnlaceAusentismo): string {
        const cuerpo: CuerpoEnlace = { ...payload, exp: Date.now() + DURACION_MS };
        const datos = Buffer.from(JSON.stringify(cuerpo)).toString('base64url');
        const firma = firmar(datos, this.secreto);
        return `${datos}.${firma}`;
    }

    verificar(token: string): PayloadEnlaceAusentismo | null {
        const [datos, firma] = token.split('.');
        if (!datos || !firma) return null;
        if (!firmasCoinciden(firmar(datos, this.secreto), firma)) return null;

        try {
            const cuerpo = JSON.parse(Buffer.from(datos, 'base64url').toString('utf8')) as CuerpoEnlace;
            if (typeof cuerpo.exp !== 'number' || cuerpo.exp < Date.now()) return null;
            if (typeof cuerpo.ausentismoId !== 'string' || typeof cuerpo.jefeId !== 'string') return null;
            return { ausentismoId: cuerpo.ausentismoId, jefeId: cuerpo.jefeId };
        } catch {
            return null;
        }
    }
}
