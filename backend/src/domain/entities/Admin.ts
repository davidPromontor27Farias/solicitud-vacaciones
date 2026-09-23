
export interface AdminProps {
    id: string;
    usuario: string;
    nombre: string;
    passwordHash: string;
}

export class Admin {
    constructor(private props: AdminProps) {}
    get id() { return this.props.id; }
    get usuario() { return this.props.usuario; }
    get nombre() { return this.props.nombre; }
    get passwordHash() { return this.props.passwordHash; }

    toProps(): AdminProps {
        return { ...this.props };
    }
}
