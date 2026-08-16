import { app } from "./app";
import { closeDatabase } from "./config/database";
import { connectRedis, closeRedis } from "./config/redis";
import { env } from "./config/env";
import { startExpirationJob } from "./jobs/expirationJob";
import { createTicketIndex } from "./search/indexManager";
import { retryPendingTicketSync } from "./search/sync";

const server = app.listen(env.PORT, () => {
  console.info(`Book The Game API listening on port ${env.PORT}`);
  void connectRedis();
  void createTicketIndex(false).catch((error) => {
    console.warn("Elasticsearch initialization deferred", { message: error instanceof Error ? error.message : String(error) });
  });
});
const job = startExpirationJob();
const searchSyncRetry = setInterval(() => void retryPendingTicketSync(), 60_000);
searchSyncRetry.unref();

async function shutdown(signal: string) {
  console.info("Graceful shutdown started", { signal });
  job.stop();
  clearInterval(searchSyncRetry);
  server.close(async () => {
    await Promise.all([closeDatabase(), closeRedis()]);
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
