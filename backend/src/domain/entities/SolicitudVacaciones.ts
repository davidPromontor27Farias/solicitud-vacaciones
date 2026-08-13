import { dividirNombres } from '../../shared/texto';

export type EstatusSolicitud = 'pendiente' | 'aprobada' | 'revocada' | 'rechazada';

export interface SolicitudVacacionesProps{
    id: string;
    empleadoId: string;
    estatus: EstatusSolicitud;
    dias: Date[];
    backupNombre?: string | null;
    motivoRevocacion?: string | null;
    motivoRechazo?: string | null;
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



    revocar(motivo: string, revocadoPorId: string): void{
        if(this.props.estatus !== 'aprobada'){
            throw new Error('Solo se pueden revocar solicitudes aprobadas')
        }

        this.props.estatus = 'revocada';
        this.props.motivoRevocacion = motivo;
        this.props.revocadoPorId = revocadoPorId;
        this.props.resueltoAt = new Date();
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
        return {...this.props, dias: [...this.props.dias]};
    }
}