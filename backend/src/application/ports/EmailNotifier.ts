

export type TipoNotificacion =
    | 'activacion_cuenta'
    | 'restablecer_password'
    | 'solicitud_creada'
    | 'solicitud_rechazada'
    | 'aprobacion_empleado'
    | 'aprobacion_nomina'
    | 'aprobacion_jefe_matricial'
    | 'revocacion'

export interface EmailNotifier{
    encolar( params: {
        tipo: TipoNotificacion;
        destinatario: string;
        solicitudId?: string;
        datos: Record<string, string>
    }): Promise<void>;
}