import cors from "@fastify/cors";
import Fastify from "fastify";
import { registerRunRoutes } from "./api/runs.routes.js";
import { initDb } from "./db/client.js";

initDb();

const PORT = Number(process.env.PORT ?? 5173);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: "http://localhost:4000",
});

app.get("/health", async () => ({ ok: true }));

await registerRunRoutes(app);

async function start() {
  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
