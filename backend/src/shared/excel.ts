const DIACRITICOS = /[̀-ͯ]/g;

export function normalizarEncabezado(texto: string): string {
    return texto
        .normalize('NFD')
        .replace(DIACRITICOS, '')
        .trim()
        .toLowerCase();
}

export function obtenerValor(fila: Record<string, unknown>, ...alias: string[]): unknown {
    const aliasNormalizados = alias.map(normalizarEncabezado);
    for (const [clave, valor] of Object.entries(fila)) {
        if (aliasNormalizados.includes(normalizarEncabezado(clave)) && valor != null) {
            return valor;
        }
    }
    return null;
}

export function obtenerTexto(fila: Record<string, unknown>, ...alias: string[]): string {
    const valor = obtenerValor(fila, ...alias);
    return valor != null ? String(valor).trim() : '';
}

export function obtenerNumero(fila: Record<string, unknown>, ...alias: string[]): number | null {
    const valor = obtenerValor(fila, ...alias);
    if (valor == null) return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

export function obtenerFecha(fila: Record<string, unknown>, ...alias: string[]): Date | null {
    const valor = obtenerValor(fila, ...alias);
    if (!(valor instanceof Date)) return null;
    // Los seriales de fecha de Excel a veces traen segundos de ruido de punto flotante;
    // se normaliza a medianoche UTC para poder comparar contra columnas @db.Date.
    return new Date(Date.UTC(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate()));
}
