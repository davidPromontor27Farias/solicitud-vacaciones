export interface PlanificacionVacacionesProps {
    id: string;
    empleadoId: string;
    jefeId: string;
    fecha: Date;
    nota?: string | null;
}

export class PlanificacionVacaciones {
    constructor(private props: PlanificacionVacacionesProps) {}

    get id() { return this.props.id; }
    get empleadoId() { return this.props.empleadoId; }
    get jefeId() { return this.props.jefeId; }
    get fecha() { return this.props.fecha; }
    get nota() { return this.props.nota ?? null; }

    toProps(): PlanificacionVacacionesProps {
        return { ...this.props };
    }
}
