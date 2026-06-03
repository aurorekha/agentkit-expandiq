import Fastify from "fastify";
import { initDb } from "./db/client.js";

initDb();

const PORT = Number(process.env.PORT ?? 5173);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));

async function start() {
  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
