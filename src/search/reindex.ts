import { env } from "../config/env";
import { bulkIndexTickets, createTicketIndex } from "./indexManager";
import { listSearchDocuments } from "./repository";

export interface ReindexSummary {
  read: number;
  successful: number;
  failed: Array<{ id: string; reason: string }>;
}

export async function reindexAllTickets(options: { recreate?: boolean } = {}): Promise<ReindexSummary> {
  await createTicketIndex(options.recreate ?? false);
  const summary: ReindexSummary = { read: 0, successful: 0, failed: [] };
  let afterTicketId = "0";
  while (true) {
    const documents = await listSearchDocuments(afterTicketId, env.ELASTICSEARCH_REINDEX_BATCH_SIZE);
    if (documents.length === 0) break;
    summary.read += documents.length;
    const result = await bulkIndexTickets(documents);
    summary.successful += result.successful;
    summary.failed.push(...result.failed);
    afterTicketId = documents.at(-1)!.ticketId;
    console.info("Elasticsearch reindex batch", {
      lastTicketId: afterTicketId,
      read: documents.length,
      successful: result.successful,
      failed: result.failed.length
    });
  }
  return summary;
}
