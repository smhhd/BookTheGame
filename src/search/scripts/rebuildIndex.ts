import { closeDatabase } from "../../config/database";
import { reindexAllTickets } from "../reindex";

reindexAllTickets({ recreate: true })
  .then((summary) => { console.info("Elasticsearch index rebuilt", summary); if (summary.failed.length) process.exitCode = 1; })
  .catch((error) => { console.error("Elasticsearch rebuild failed", error); process.exitCode = 1; })
  .finally(() => closeDatabase());
