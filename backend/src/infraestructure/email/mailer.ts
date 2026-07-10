interface ParametrosCorreo {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
}

export async function enviarCorreo(params: ParametrosCorreo): Promise<void> {
    const respuesta = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: params.from,
            to: params.to,
            subject: params.subject,
            text: params.text,
            html: params.html,
        }),
    });

    if (!respuesta.ok) {
        const detalle = await respuesta.text().catch(() => '');
        throw new Error(`Resend respondió ${respuesta.status}: ${detalle}`);
    }
}
