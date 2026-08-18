import Fastify from 'fastify';
import { getUsers, pool } from './db';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

export function buildServer() {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/users', async (_request, reply) => {
    try {
      return await getUsers();
    } catch (err) {
      app.log.error({ err }, 'failed to load users');
      reply.code(503);

      return { error: 'database unavailable' };
    }
  });

  return app;
}

async function main() {
  const app = buildServer();

  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, shutting down`);

    try {
      await app.close();
      await pool.end();

      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'error during shutdown');

      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  await app.listen({ port: PORT, host: HOST });
}

main().catch((err) => {
  console.error(err);

  process.exit(1);
});