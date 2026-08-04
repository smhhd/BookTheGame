import { closeDatabase } from "../../config/database";
import { createTicketIndex } from "../indexManager";

createTicketIndex(false)
  .then((result) => console.info("Elasticsearch index ready", result))
  .catch((error) => { console.error("Could not create Elasticsearch index", error); process.exitCode = 1; })
  .finally(() => closeDatabase());
