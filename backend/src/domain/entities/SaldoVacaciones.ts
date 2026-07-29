

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


    estaVigente(fecha: Date): boolean {
        return fecha >= this.props.inicioValidez && fecha <= this.props.fechaLimiteDisfrute;
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

    reconciliarDesdeSap(diasPorLey: number, diasDisfrutadosSap: number, fechaVencimiento: Date): void {
        const diasDisfrutados = Math.max(this.props.diasDisfrutados, diasDisfrutadosSap);
        this.props.diasPorLey = diasPorLey;
        this.props.diasDisfrutados = diasDisfrutados;
        this.props.diasPendientes = Math.max(diasPorLey - diasDisfrutados, 0);
        this.props.fechaVencimiento = fechaVencimiento;
    }

    toProps(): SaldoVacacionesProps {
        return {...this.props}
    }
}