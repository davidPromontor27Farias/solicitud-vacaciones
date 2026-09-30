

export interface PayloadEnlaceAusentismo {
    ausentismoId: string;
    jefeId: string;
}

export interface EnlaceAusentismoGenerator {
    generar(payload: PayloadEnlaceAusentismo): string;
    verificar(token: string): PayloadEnlaceAusentismo | null;
}

