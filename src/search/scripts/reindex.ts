import { closeDatabase } from "../../config/database";
import { reindexAllTickets } from "../reindex";

reindexAllTickets()
  .then((summary) => { console.info("Elasticsearch reindex completed", summary); if (summary.failed.length) process.exitCode = 1; })
  .catch((error) => { console.error("Elasticsearch reindex failed", error); process.exitCode = 1; })
  .finally(() => closeDatabase());
