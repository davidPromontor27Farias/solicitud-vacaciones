export interface PayloadEnlaceRevision {
    solicitudId: string;
    jefeId: string;
}

export interface EnlaceRevisionGenerator {
    generar(payload: PayloadEnlaceRevision): string;
    verificar(token: string): PayloadEnlaceRevision | null;
}
