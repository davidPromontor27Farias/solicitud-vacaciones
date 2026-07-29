

import {FastifyReply, FastifyRequest} from 'fastify'


export async function authenticateAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void>{

    try{
        await request.jwtVerify();
    }
    catch{
        reply.status(401).send({error: 'No autenticado'});
        return;
    }

    const payload = request.user as {rol?: string};
    if(payload.rol !== 'admin'){
        reply.status(401).send({error: 'No autenticado'});
    }
}