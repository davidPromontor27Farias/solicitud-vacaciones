import nodemailer from 'nodemailer';

interface AdjuntoCorreo {
    filename: string;
    content: Buffer;
    cid: string;
    contentType: string;
}

interface ParametrosCorreo {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
    attachments?: AdjuntoCorreo[];
}

const smtpTransporter = process.env.EMAIL_PROVIDER === 'smtp'
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587 ) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
    }) : null;

async function enviarPorSmtp(params: ParametrosCorreo): Promise<void>{
    await smtpTransporter!.sendMail(params);
}

async function enviarPorResend(params: ParametrosCorreo): Promise<void>{
    const respuesta = await fetch('https://api.resend.com/emails' , {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            from: params.from,
            to: params.to,
            subject: params.subject,
            text: params.text,
            html: params.html,
            attachments: params.attachments?.map((a) => ({
                filename: a.filename,
                content: a.content.toString('base64'),
                content_id: a.cid,
                content_type: a.contentType,
            })),
        })
    });

    if(!respuesta.ok){
        const detalle = await respuesta.text().catch(() => '');
        throw new Error(`Resend respondio ${respuesta.status}: ${detalle}`);
    }
}

export async function enviarCorreo(params: ParametrosCorreo): Promise<void>{
    if(process.env.EMAIL_PROVIDER === 'smtp'){
        return enviarPorSmtp(params);
    }

    return enviarPorResend(params);
}
