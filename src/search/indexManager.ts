import { env } from "../config/env";
import { elasticRequest, ElasticsearchRequestError } from "./client";
import { ticketIndexDefinition } from "./mapping";
import { BulkResult, TicketSearchDocument } from "./types";

export async function ticketIndexExists(): Promise<boolean> {
  try {
    await elasticRequest<unknown>(env.ELASTICSEARCH_INDEX, { method: "HEAD" });
    return true;
  } catch (error) {
    if (error instanceof ElasticsearchRequestError && error.status === 404) return false;
    throw error;
  }
}

export async function createTicketIndex(recreate = false) {
  const exists = await ticketIndexExists();
  if (exists && !recreate) return { created: false, index: env.ELASTICSEARCH_INDEX };
  if (exists) await elasticRequest(env.ELASTICSEARCH_INDEX, { method: "DELETE" });
  await elasticRequest(env.ELASTICSEARCH_INDEX, {
    method: "PUT",
    body: JSON.stringify(ticketIndexDefinition)
  });
  return { created: true, index: env.ELASTICSEARCH_INDEX };
}

interface BulkResponse {
  errors: boolean;
  items: Array<Record<string, { _id: string; status: number; error?: { reason?: string } }>>;
}

export async function bulkIndexTickets(documents: readonly TicketSearchDocument[]): Promise<BulkResult> {
  if (documents.length === 0) return { successful: 0, failed: [] };
  const lines = documents.flatMap((document) => [
    JSON.stringify({ index: { _index: env.ELASTICSEARCH_INDEX, _id: document.ticketId } }),
    JSON.stringify(document)
  ]);
  const response = await elasticRequest<BulkResponse>("_bulk?refresh=true", {
    method: "POST",
    headers: { "content-type": "application/x-ndjson" },
    rawBody: `${lines.join("\n")}\n`
  });
  const failed = response.items.flatMap((item) => {
    const action = Object.values(item)[0]!;
    return action.status >= 300 ? [{ id: action._id, reason: action.error?.reason ?? `HTTP ${action.status}` }] : [];
  });
  return { successful: documents.length - failed.length, failed };
}

export async function deleteTicketDocuments(ticketIds: readonly (string | number)[]): Promise<void> {
  if (ticketIds.length === 0) return;
  const lines = ticketIds.map((id) => JSON.stringify({ delete: { _index: env.ELASTICSEARCH_INDEX, _id: String(id) } }));
  await elasticRequest("_bulk?refresh=true", {
    method: "POST",
    headers: { "content-type": "application/x-ndjson" },
    rawBody: `${lines.join("\n")}\n`
  });
}
