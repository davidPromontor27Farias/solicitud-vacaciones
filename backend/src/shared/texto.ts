export function dividirNombres(valor: string): string[] {
    const texto = valor.trim();
    // "N/A" (sin backup asignado) no es una lista de nombres separados por "/".
    if (/^n\/a\b/i.test(texto)) return [texto];

    return texto
        .split('/')
        .map((n) => n.trim())
        .filter(Boolean);
}
