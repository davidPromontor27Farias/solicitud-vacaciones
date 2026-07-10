export type EstatusSolicitud = 'pendiente' | 'aprobada' | 'revocada' | 'rechazada';

export interface SolicitudVacacionesProps{
    id: string;
    empleadoId: string;
    estatus: EstatusSolicitud;
    dias: Date[];
    backupNombre?: string | null;
    motivoRevocacion?: string | null;
    revocadoPorId?: string | null;
    createdAt: Date;
    resueltoAt: Date | null;
}

export class SolicitudVacaciones {
    constructor(private props: SolicitudVacacionesProps){}

    get id() {return this.props.id;}
    get empleadoId() {return this.props.empleadoId;}
    get estatus() {return this.props.estatus;}
    get dias() {return [...this.props.dias];}
    get cantidadDias() {return this.props.dias.length;}
    get backupNombre() {return this.props.backupNombre ?? null}
    get motivoRevocacion() {return this.props.motivoRevocacion ?? null}

    aprobar(backupNombre: string): void {
        if(this.props.estatus !== 'pendiente'){
            throw new Error('Solo se pueden aproar solicitudes pendientes')
        }
        if(!backupNombre?.trim()){
            throw new Error('El nombre del backup es obligatorio para aprobar')
        }
        this.props.estatus = 'aprobada';
        this.props.backupNombre = backupNombre.trim();
        this.props.resueltoAt = new Date();
    }

    revocar(motivo: string, revocadoPorId: string): void{
        if(this.props.estatus !== 'aprobada'){
            throw new Error('Solo se pueden revocar solicitudes aprobadas')
        }

        this.props.estatus = 'revocada';
        this.props.motivoRevocacion = motivo;
        this.props.revocadoPorId = revocadoPorId;
        this.props.resueltoAt = new Date();
    }

    rechazar(): void{
        if(this.props.estatus !== 'pendiente'){
            throw new Error('Solo se pueden rechazar solicitudes pendientes')
        }
        this.props.estatus = 'rechazada';
        this.props.resueltoAt = new Date();

    }

    toProps(): SolicitudVacacionesProps{
        return {...this.props, dias: [...this.props.dias]};
    }
}