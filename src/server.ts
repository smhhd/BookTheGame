import { app } from "./app";
import { closeDatabase } from "./config/database";
import { connectRedis, closeRedis } from "./config/redis";
import { env } from "./config/env";
import { startExpirationJob } from "./jobs/expirationJob";

const server = app.listen(env.PORT, () => {
  console.info(`Book The Game API listening on port ${env.PORT}`);
  void connectRedis();
});
const job = startExpirationJob();

async function shutdown(signal: string) {
  console.info("Graceful shutdown started", { signal });
  job.stop();
  server.close(async () => {
    await Promise.all([closeDatabase(), closeRedis()]);
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
