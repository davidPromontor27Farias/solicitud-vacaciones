import { dividirNombres } from '../../shared/texto';

export type EstatusSolicitud = 'pendiente' | 'aprobada' | 'revocada' | 'rechazada';

export interface SolicitudVacacionesProps{
    id: string;
    empleadoId: string;
    estatus: EstatusSolicitud;
    dias: Date[];
    diasRevocados?: Date[];
    backupNombre?: string | null;
    motivoRevocacion?: string | null;
    motivoRechazo?: string | null;
    revocadoPorId?: string | null;
    createdAt: Date;
    resueltoAt: Date | null;
}

function mismoDia(a: Date, b: Date): boolean {
    return a.getTime() === b.getTime();
}

export class SolicitudVacaciones {
    constructor(private props: SolicitudVacacionesProps){}

    get id() {return this.props.id;}
    get empleadoId() {return this.props.empleadoId;}
    get estatus() {return this.props.estatus;}
    get dias() {return [...this.props.dias];}
    get diasRevocados() {return [...(this.props.diasRevocados ?? [])];}
    // Dias de la solicitud que siguen aprobados (no han sido revocados). En una solicitud
    // nunca revocada, es igual a `dias`; tras una revocacion parcial, es el subconjunto
    // restante que aun cuenta como disfrutado/programado y que se puede volver a revocar.
    get diasActivos() {
        const revocados = this.props.diasRevocados ?? [];
        return this.props.dias.filter((dia) => !revocados.some((r) => mismoDia(r, dia)));
    }
    get cantidadDias() {return this.props.dias.length;}
    get backupNombre() {return this.props.backupNombre ?? null}
    get motivoRevocacion() {return this.props.motivoRevocacion ?? null}
    get createdAt() {return this.props.createdAt;}
    get motivoRechazo() {return this.props.motivoRechazo ?? null}

    aprobar(): void {
        if(this.props.estatus !== 'pendiente'){
            throw new Error('Solo se pueden aprobar solicitudes pendientes');
        }

        this.props.estatus = 'aprobada';
        this.props.resueltoAt = new Date();
    }

    seleccionarBackup(nombre: string): void {
        if(this.props.estatus !== 'pendiente'){
            throw new Error('Solo se puede definir el backup de solicitudes pendientes');
        }

        const opciones = dividirNombres(this.props.backupNombre ?? '');
        if(opciones.length > 1 && !opciones.includes(nombre)){
            throw new Error('El backup seleccionado no es una de las opciones registradas');
        }

        this.props.backupNombre = nombre;
    }



    // Revoca uno o varios dias especificos de una solicitud aprobada (ej. de 5 dias
    // solicitados, revocar solo los 2 que aun no han pasado). Si con esto ya no queda
    // ningun dia activo, la solicitud completa pasa a "revocada" (mismo comportamiento
    // que antes al revocarla entera).
    revocarDias(dias: Date[], motivo: string, revocadoPorId: string): void {
        if(this.props.estatus !== 'aprobada'){
            throw new Error('Solo se pueden revocar solicitudes aprobadas')
        }
        if(dias.length === 0){
            throw new Error('Selecciona al menos un dia para revocar');
        }

        const activos = this.diasActivos;
        const invalido = dias.find((dia) => !activos.some((d) => mismoDia(d, dia)));
        if(invalido){
            throw new Error('Alguno de los dias seleccionados no pertenece a esta solicitud o ya fue revocado');
        }

        this.props.diasRevocados = [...(this.props.diasRevocados ?? []), ...dias];
        this.props.motivoRevocacion = motivo;
        this.props.revocadoPorId = revocadoPorId;

        if(this.diasActivos.length === 0){
            this.props.estatus = 'revocada';
            this.props.resueltoAt = new Date();
        }
    }

    // Revoca la solicitud completa (todos los dias que sigan activos).
    revocar(motivo: string, revocadoPorId: string): void{
        this.revocarDias(this.diasActivos, motivo, revocadoPorId);
    }

    rechazar(motivo: string): void{
        if(this.props.estatus !== 'pendiente'){
            throw new Error('Solo se pueden rechazar solicitudes pendientes')
        }
        if(!motivo?.trim()){
            throw  new Error('El motivo es obligatorio para rechazar');
        }

        this.props.estatus = 'rechazada';
        this.props.motivoRechazo = motivo.trim();
        this.props.resueltoAt = new Date();


    }

    toProps(): SolicitudVacacionesProps{
        return {...this.props, dias: [...this.props.dias], diasRevocados: [...(this.props.diasRevocados ?? [])]};
    }
}
