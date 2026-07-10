

export interface SaldoVacacionesProps {
    id: string;
    empleadoId: string;
    diasPorLey: number;
    diasDisfrutados: number;
    diasPendientes: number;
    inicioValidez: Date;
    fechaVencimiento: Date;
}

export class SaldoVacaciones {
    constructor(private props: SaldoVacacionesProps) {}

    get id() {return this.props.id}
    get empleadoId() {return this.props.empleadoId}
    get diasPorLey() {return this.props.diasPorLey}
    get diasDisfrutados() {return this.props.diasDisfrutados}
    get diasPendientes() {return this.props.diasPendientes}
    get inicioValidez() {return this.props.inicioValidez}
    get fechaVencimiento(){ return this.props.fechaVencimiento}

    estaVigente(fecha: Date): boolean {
        return fecha >= this.props.inicioValidez && fecha <= this.props.fechaVencimiento;
    }

    tieneDiasSuficientes(cantidadDias: number): boolean{
        return this.props.diasPendientes >= cantidadDias;
    }

    descontarDias(cantidadDias: number): void {
        if(!this.tieneDiasSuficientes(cantidadDias)){
            throw new Error('Días pendientes insuficientes')
        }
        this.props.diasPendientes -= cantidadDias;
        this.props.diasDisfrutados += cantidadDias;
    }

    restituirDias(cantidadDias: number): void{
        this.props.diasPendientes += cantidadDias;
        this.props.diasDisfrutados -= cantidadDias;
    }

    toProps(): SaldoVacacionesProps {
        return {...this.props}
    }
}