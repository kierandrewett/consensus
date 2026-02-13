import Fastify, { FastifyInstance } from 'fastify';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyFormbody from '@fastify/formbody';
import { config } from '../config';

export async function createServer(): Promise<FastifyInstance> {
    const fastify = Fastify({
        logger: true
    });

    // Register form body parser
    await fastify.register(fastifyFormbody);

    // Register cookie plugin (required by session)
    await fastify.register(fastifyCookie);

    // Register session plugin
    await fastify.register(fastifySession, {
        secret: config.session.secret,
        cookieName: config.session.cookieName,
        cookie: {
            secure: false
        }
    });

    // Register view engine
    await fastify.register(fastifyView, config.views);

    // Register static file serving
    await fastify.register(fastifyStatic, {
        root: config.static.root,
        prefix: '/public/'
    });

    return fastify;
}
