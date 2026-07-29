
export type RolAdmin = 'lectura' | 'nominas';

export interface AdminProps {
    id: string;
    usuario: string;
    nombre: string;
    passwordHash: string;
    rol: RolAdmin;
}

export class Admin {
    constructor(private props: AdminProps) {}
    get id() { return this.props.id; }
    get usuario() { return this.props.usuario; }
    get nombre() { return this.props.nombre; }
    get passwordHash() { return this.props.passwordHash; }
    get rol() { return this.props.rol; }

    toProps(): AdminProps {
        return { ...this.props };
    }
}
