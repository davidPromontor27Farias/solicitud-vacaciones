
export interface EmpleadoProps {
    id: string;
    numeroEmpleado: string;
    nombre: string;
    sociedad?: string | null;
    puesto?: string | null;
    departamento?: string | null;
    correoPersonal?: string | null;
    passwordHash?: string | null;
    primerAcceso: boolean;
    intentosFallidos: number;
    bloqueadoHasta?: Date | null;
    jefeDirectoId?: string | null;
    jefeMatricialId?: string | null;
    recibeNotificacionesMatricial: boolean;
}

export class Empleado {
    constructor(private props: EmpleadoProps) {}
    get id() {return this.props.id;}
    get numeroEmpleado() {return this.props.numeroEmpleado;}
    get nombre() {return this.props.nombre}
    get sociedad() {return this.props.sociedad ?? null;}
    get puesto() {return this.props.puesto ?? null;}
    get departamento() {return this.props.departamento ?? null;}
    get correoPersonal() {return this.props.correoPersonal ?? null;}
    get passwordHash(){return this.props.passwordHash}
    get primerAcceso(){return this.props.primerAcceso;}
    get jefeDirectoId() {return this.props.jefeDirectoId ?? null;}
    get jefeMatricialId(){return this.props.jefeMatricialId ?? null}
    get recibeNotificacionesMatricial() {return this.props.recibeNotificacionesMatricial;}

    estaBloqueado(ahora: Date = new Date()): boolean {
        return !!this.props.bloqueadoHasta && this.props.bloqueadoHasta > ahora;
    }

    registrarIntentoFallido(): void {
        this.props.intentosFallidos += 1;
        if(this.props.intentosFallidos >= 5){
            const bloqueo = new Date();
            bloqueo.setMinutes(bloqueo.getMinutes() + 15);
            this.props.bloqueadoHasta = bloqueo;
        }
    }

    reiniciarIntentosFallidos(): void {
        this.props.intentosFallidos = 0;
        this.props.bloqueadoHasta = null;
    }

    establecerPassword(hash: string): void{
        this.props.passwordHash = hash;
        this.props.primerAcceso = false;
    }

    registrarCorreo(correo: string): void{
        this.props.correoPersonal = correo;
    }

    toProps(): EmpleadoProps {
        return { ...this.props};
    }
}