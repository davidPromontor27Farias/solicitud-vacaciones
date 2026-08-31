

export interface SaldoVacacionesProps {
    id: string;
    empleadoId: string;
    diasPorLey: number;
    diasDisfrutados: number;
    diasPendientes: number;
    inicioValidez: Date;
    fechaVencimiento: Date;
    finValidez: Date;
    fechaLimiteDisfrute: Date;
}

export const DIAS_UMBRAL_CRITICO = 30;

export class SaldoVacaciones {
    constructor(private props: SaldoVacacionesProps) {}

    get id() {return this.props.id}
    get empleadoId() {return this.props.empleadoId}
    get diasPorLey() {return this.props.diasPorLey}
    get diasDisfrutados() {return this.props.diasDisfrutados}
    get diasPendientes() {return this.props.diasPendientes}
    get inicioValidez() {return this.props.inicioValidez}
    get fechaVencimiento(){ return this.props.fechaVencimiento}
    get finValidez() {return this.props.finValidez}
    get fechaLimiteDisfrute() {return this.props.fechaLimiteDisfrute}

    estaVencido(fecha: Date): boolean {
        return fecha > this.props.fechaLimiteDisfrute;
    }
    diasPorVencer(fecha: Date): number{
        const msPorDia = 24 * 60 * 60 * 1000;
        return Math.ceil((this.props.fechaLimiteDisfrute.getTime() - fecha.getTime()) /msPorDia);
    }

    estaCritico(fecha: Date): boolean {
        return !this.estaVencido(fecha) && this.diasPorVencer(fecha) <= DIAS_UMBRAL_CRITICO;
    }


    estaVigente(fecha: Date): boolean {
        return fecha >= this.props.finValidez && fecha <= this.props.fechaLimiteDisfrute;
    }

    tieneDiasSuficientes(cantidadDias: number): boolean{
        return this.props.diasPendientes >= cantidadDias;
    }

    // Reserva dias del cupo disponible al aprobarse una solicitud. No toca diasDisfrutados:
    // ese campo solo debe reflejar dias ya tomados (fecha ya transcurrida), y eso se calcula
    // en ObtenerPerfilEmpleado a partir de las solicitudes aprobadas, no aqui.
    descontarDias(cantidadDias: number): void {
        if(!this.tieneDiasSuficientes(cantidadDias)){
            throw new Error('Días pendientes insuficientes')
        }
        this.props.diasPendientes -= cantidadDias;
    }

    restituirDias(cantidadDias: number): void{
        this.props.diasPendientes += cantidadDias;
    }

    reconciliarDesdeSap(datos: {
        diasPorLey: number;
        diasDisfrutadosSap: number;
        fechaVencimiento: Date;
        finValidez: Date;
        fechaLimiteDisfrute: Date;
    }): void {
        // El sistema puede haber descontado días (solicitudes aprobadas) que SAP todavía
        // no refleja porque nómina no ha procesado esa liquidación: nunca se retrocede
        // diasDisfrutados, solo se adopta el valor de SAP cuando este ya alcanzó o superó al local.
        const diasDisfrutados = Math.max(this.props.diasDisfrutados, datos.diasDisfrutadosSap);
        this.props.diasPorLey = datos.diasPorLey;
        this.props.diasDisfrutados = diasDisfrutados;
        this.props.diasPendientes = Math.max(datos.diasPorLey - diasDisfrutados, 0);
        this.props.fechaVencimiento = datos.fechaVencimiento;
        this.props.finValidez = datos.finValidez;
        this.props.fechaLimiteDisfrute = datos.fechaLimiteDisfrute;
    }

    toProps(): SaldoVacacionesProps {
        return {...this.props}
    }
}