interface CorreoRenderizado {
    subject: string;
    text: string;
    html: string;
}

function escaparHtml(valor: string): string {
    return valor
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}   

function envolverPlantilla(contenido: string): string {
    return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);max-width:100%;">
            <tr>
              <td style="background-color:#4338ca;padding:20px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:600;">Vacaciones Imperquimia</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#374151;font-size:14px;line-height:1.6;">
                ${contenido}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background-color:#f9fafb;color:#9ca3af;font-size:12px;">
                Este es un correo automático del sistema de solicitud de vacaciones. No respondas a este mensaje.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function filaTabla(etiqueta: string, valor: string): string {
    return `<tr>
        <td style="padding:4px 16px 4px 0;color:#6b7280;white-space:nowrap;">${etiqueta}</td>
        <td style="padding:4px 0;font-weight:600;color:#111827;">${valor}</td>
    </tr>`;
}

function tabla(filas: string): string {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;font-size:14px;">${filas}</table>`;
}

export function construirCorreo(tipo: string, datos: Record<string, string>): CorreoRenderizado {
    switch (tipo) {
        case 'activacion_cuenta': {
            const nombre = datos.nombre ?? '';
            const codigo = datos.token ?? '';
            return {
                subject: 'Activa tu cuenta de Vacaciones',
                text: `Hola ${nombre}, tu código de activación es: ${codigo}\n\nIngrésalo en la pantalla de activación de cuenta junto con tu nueva contraseña. Este código expira en 24 horas.`,
                html: envolverPlantilla(`
                    <p style="margin:0 0 16px;">Hola <strong>${escaparHtml(nombre)}</strong>,</p>
                    <p style="margin:0 0 24px;">Usa el siguiente código para activar tu cuenta y crear tu contraseña:</p>
                    <p style="margin:0 0 24px;text-align:center;">
                        <span style="display:inline-block;background-color:#eef2ff;color:#4338ca;font-size:28px;font-weight:700;letter-spacing:8px;padding:12px 20px;border-radius:8px;">${codigo}</span>
                    </p>
                    <p style="margin:0;color:#6b7280;font-size:13px;">Este código expira en 24 horas. Si tú no solicitaste esto, ignora este correo.</p>
                `),
            };
        }

        case 'restablecer_password': {
            const nombre = datos.nombre ?? '';
            const codigo = datos.token ?? '';
            return {
                subject: 'Restablece tu contraseña de Vacaciones',
                text: `Hola ${nombre}, tu código para restablecer tu contraseña es: ${codigo}\n\nIngrésalo en la pantalla de recuperar contraseña junto con tu nueva contraseña. Este código expira en 1 hora.`,
                html: envolverPlantilla(`
                    <p style="margin:0 0 16px;">Hola <strong>${escaparHtml(nombre)}</strong>,</p>
                    <p style="margin:0 0 24px;">Recibimos una solicitud para restablecer tu contraseña. Usa este código:</p>
                    <p style="margin:0 0 24px;text-align:center;">
                        <span style="display:inline-block;background-color:#eef2ff;color:#4338ca;font-size:28px;font-weight:700;letter-spacing:8px;padding:12px 20px;border-radius:8px;">${codigo}</span>
                    </p>
                    <p style="margin:0;color:#6b7280;font-size:13px;">Este código expira en 1 hora. Si tú no solicitaste esto, ignora este correo — tu contraseña actual seguirá funcionando.</p>
                `),
            };
        }

        case 'solicitud_creada': {
            const empleado = datos.empleado ?? '';
            const dias = datos.dias ?? '';
            const primerDia = datos.primerDia ?? '';
            return {
                subject: 'Nueva solicitud de vacaciones para tu aprobación',
                text: `${empleado} solicitó ${dias} día(s) de vacaciones a partir del ${primerDia}. Ingresa a la app para aprobar o rechazar.`,
                html: envolverPlantilla(`
                    <p style="margin:0 0 16px;">Tienes una nueva solicitud de vacaciones pendiente de revisión:</p>
                    ${tabla(
                        filaTabla('Empleado', escaparHtml(empleado)) +
                        filaTabla('Días solicitados', dias) +
                        filaTabla('A partir de', primerDia)
                    )}
                    <p style="margin:0;">
                        <a href="${process.env.APP_URL ?? ''}/revisar/${datos.enlaceToken ?? ''}" style="display:inline-block;background-color:#4338ca;color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:6px;font-weight:600;">Revisar solicitud</a>
                    </p>
                `),
            };
        }

        case 'aprobacion_empleado': {
            const dias = datos.dias ?? '';
            const backup = datos.backup ?? '';
            return {
                subject: 'Tu solicitud de vacaciones fue aprobada',
                text: `Tu solicitud de ${dias} día(s) fue aprobada. Backup: ${backup}`,
                html: envolverPlantilla(`
                    <p style="margin:0 0 16px;">Buenas noticias — tu solicitud de vacaciones fue <strong style="color:#059669;">aprobada</strong>.</p>
                    ${tabla(
                        filaTabla('Días', dias) +
                        filaTabla('Backup asignado', escaparHtml(backup))
                    )}
                `),
            };
        }

        case 'solicitud_rechazada': {
            const dias = datos.dias ?? '';
            const motivo = datos.motivo ?? '';
            return {
                subject: 'Tu solicitud de vacaciones fue rechazada',
                text: `Tu solicitud de ${dias} día(s) fue rechazada. Motivo: ${motivo}`,
                html: envolverPlantilla(`
                    <p style="margin:0 0 16px;">Tu solicitud de <strong>${dias}</strong> día(s) de vacaciones fue <strong style="color:#dc2626;">rechazada</strong>.</p>
                    ${tabla(filaTabla('Motivo', escaparHtml(motivo)))}
                `),
            };
        }

        case 'revocacion': {
            const dias = datos.dias ?? '';
            const motivo = datos.motivo ?? '';
            const empleado = datos.empleado;
            return {
                subject: empleado ? `Revocación de vacaciones: ${escaparHtml(empleado)}` : 'Tu solicitud de vacaciones fue revocada',
                text: empleado
                    ? `${empleado} tuvo ${dias} día(s) de vacaciones revocados. Motivo: ${escaparHtml(motivo)}`
                    : `Tu solicitud de ${dias} día(s) fue revocada. Motivo: ${escaparHtml(motivo)}`,
                html: envolverPlantilla(`
                    <p style="margin:0 0 16px;">
                        ${empleado ? `<strong>${empleado}</strong> tuvo` : 'Tu solicitud de vacaciones ya aprobada fue'}
                        <strong style="color:#dc2626;"> revocada</strong>.
                    </p>
                    ${tabla(
                        filaTabla('Días', dias) +
                        filaTabla('Motivo', escaparHtml(motivo))
                    )}
                `),
            };
        }

        case 'aprobacion_jefe_matricial': {
            const empleado = datos.empleado ?? '';
            const dias = datos.dias ?? '';
            return {
                subject: 'Aviso de vacacions aprobadas en tu área',
                text: `${empleado} tiene ${dias} día(s) de vacaciones aprobadas. Si no estas de acuerdo, puedes declinarla: 
            ${process.env.APP_URL ?? ''}/revisar/${datos.enlaceToken ?? ''}`,
                html: envolverPlantilla(`
                    <p style="margin: 0 0 16px,"><strong>${empleado}</strong> tiene <strong>${dias}</strong> días(s) de vacaciones aprobadas.</p>
                    <p style="margin: 0 0 16px; color:#6b7280;">Si no estas de acuerdo, puedes declinarla. Si estas de acuerdo, no hagas nada.</p>
                `)
            }
        }

        default: {
            return {
                subject: `Notificación de vacaciones: ${tipo}`,
                text: JSON.stringify(datos),
                html: envolverPlantilla(`<p style="margin:0;">${JSON.stringify(datos)}</p>`),
            };
        }
    }
}
