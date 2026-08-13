

import {FastifyReply, FastifyRequest} from 'fastify'


export async function authenticateAdminNominas(request: FastifyRequest, reply: FastifyReply): Promise<void>{

    try{
        await request.jwtVerify();
    }
    catch{
        reply.status(401).send({error: 'No autenticado'});
        return;
    }

    const payload = request.user as {rol?: string; rolAdmin?: string};
    if(payload.rol !== 'admin' || payload.rolAdmin !== 'nominas'){
        reply.status(401).send({error: 'No autenticado'});
    }
}
