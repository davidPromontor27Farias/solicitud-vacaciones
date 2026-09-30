
export type EstatusAusentismo = 'pendiente' | 'aprobado' | 'rechazado';
export type MotivoAusentismo = 
    | 'permiso_sin_goce'
    | 'permiso_con_goce' 
    | 'home_office'
    | 'tiempo_por_tiempo'
    | 'permiso_interno_salud'
    | 'permiso_salida'
    | 'permiso_entrada'


export interface AusentismoProps {
    id: string;
    empleadoId: string;
    motivo: MotivoAusentismo;
    comentario: string;
    dias: Date[];
    estatus: EstatusAusentismo;
    motivoRechazo?: string | null;
    createdAt: Date;
    resueltoAt: Date | null;
}

export class Ausentismo {
    constructor(private props: AusentismoProps) {}

    get id() {return this.props.id}
    get empleadoId() {return this.props.empleadoId}
    get motivo() {return this.props.motivo}
    get comentario() {return this.props.comentario}
    get dias(){return [...this.props.dias]}
    get cantidadDias(){return this.props.dias.length}
    get estatus(){return this.props.estatus}
    get motivoRechazo(){return this.props.motivoRechazo ?? null;}
    get createdAt() {return this.props.createdAt}
    get resueltoAt() {return this.props.resueltoAt}

    aprobar(): void {
        if(this.estatus !== 'pendiente'){
            throw new Error('Solo se pueden aprobar ausentismos pendientes')
        }

        this.props.estatus = 'aprobado';
        this.props.resueltoAt = new Date();
    }

    rechazar(motivo: string): void {
        if(this.props.estatus !== 'pendiente' ) {
            throw new Error('Solo se pueden rechazar ausentismos pendientes');
        }

        if(!motivo?.trim()){
            throw new Error('El motivo es obligatorio para rechazar');
        }

        this.props.estatus = 'rechazado';
        this.props.motivoRechazo = motivo.trim();
        this.props.resueltoAt = new Date();

    }

    toProps(): AusentismoProps{
        return {...this.props, dias: [...this.props.dias]}
    }
}

