import { SaldoVacaciones } from '../entities/SaldoVacaciones';
import { SolicitudVacaciones } from '../entities/SolicitudVacaciones';

export interface ConsumoSaldo {
    diasDisfrutados: number;
    diasProgramados: number;
    // Dias disponibles a mostrar: solo descuenta lo ya disfrutado (fecha pasada), no lo
    // programado a futuro — por eso no baja al aprobar una solicitud, solo cuando sus dias
    // van pasando.
    diasPendientes: number;
    // Saldo real para validar solicitudes nuevas: ademas de lo disfrutado, descuenta lo ya
    // programado (aprobado a futuro) para no permitir comprometer mas dias de los que
    // realmente existen, aunque esa reserva todavia no se vea reflejada en diasPendientes.
    diasPendientesEfectivo: number;
}

function inicioDelDiaUtc(fecha: Date): Date {
    return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

// Un dia de una solicitud aprobada solo se descuenta del saldo (cuenta como "disfrutado")
// una vez que la fecha ya paso. Mientras siga en el futuro se mantiene en "programado" y
// no resta de los dias disponibles: por eso revocar un dia futuro no necesita restituir
// saldo, nunca se llego a descontar.
export function calcularDiasPasadosYFuturos(
    saldos: SaldoVacaciones[],
    solicitudesAprobadas: SolicitudVacaciones[],
    fechaReferencia: Date = new Date(),
): { pasados: Map<string, number>; futuros: Map<string, number> } {
    const hoyUtc = inicioDelDiaUtc(fechaReferencia);
    const pasados = new Map<string, number>();
    const futuros = new Map<string, number>();

    for (const solicitud of solicitudesAprobadas) {
        for (const dia of solicitud.diasActivos) {
            const saldoDelDia = saldos.find((s) => s.estaVigente(dia));
            if (!saldoDelDia) continue;
            const mapa = dia < hoyUtc ? pasados : futuros;
            mapa.set(saldoDelDia.id, (mapa.get(saldoDelDia.id) ?? 0) + 1);
        }
    }

    return { pasados, futuros };
}

// diasDisfrutados usa el mayor entre lo que SAP ya confirmo y lo que ya transcurrio
// localmente, para no retroceder el contador ni duplicar el conteo cuando SAP alcance
// al sistema en la siguiente carga.
export function calcularConsumoSaldo(saldo: SaldoVacaciones, diasPasados: number, diasFuturos: number): ConsumoSaldo {
    const diasDisfrutados = Math.max(saldo.diasDisfrutados, diasPasados);
    const diasProgramados = diasFuturos;
    const diasPendientes = Math.max(saldo.diasPorLey - diasDisfrutados, 0);
    const diasPendientesEfectivo = Math.max(diasPendientes - diasProgramados, 0);
    return { diasDisfrutados, diasProgramados, diasPendientes, diasPendientesEfectivo };
}
