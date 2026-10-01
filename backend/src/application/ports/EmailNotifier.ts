

export type TipoNotificacion =
    | 'activacion_cuenta'
    | 'restablecer_password'
    | 'solicitud_creada'
    | 'solicitud_rechazada'
    | 'aprobacion_empleado'
    | 'aprobacion_parcial_empleado'
    | 'aprobacion_nomina'
    | 'aprobacion_jefe_matricial'
    | 'revocacion'
    | 'ausentismo_creado'
    | 'ausentismo_aprobado_empleado'
    | 'ausentismo_rechazado_empleado'
    | 'ausentismo_aprobado_nominas'
    | 'ausentismo_rechazado_nominas'

export interface EmailNotifier{
    encolar( params: {
        tipo: TipoNotificacion;
        destinatario: string;
        solicitudId?: string;
        ausentismoId?: string;
        datos: Record<string, string>;
    }): Promise<void>;
}