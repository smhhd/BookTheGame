import { bulkIndexTickets, createTicketIndex, deleteTicketDocuments } from "./indexManager";
import { getSearchDocuments } from "./repository";

const pendingTicketIds = new Set<string>();
let lastFailure: { at: string; message: string } | null = null;

export async function syncTicketDocuments(ticketIds: readonly (string | number)[]): Promise<boolean> {
  const uniqueIds = [...new Set(ticketIds.map(String))];
  if (uniqueIds.length === 0) return true;
  try {
    await createTicketIndex(false);
    const documents = await getSearchDocuments(uniqueIds);
    const existingIds = new Set(documents.map((document) => document.ticketId));
    const deletedIds = uniqueIds.filter((id) => !existingIds.has(id));
    const indexed = await bulkIndexTickets(documents);
    if (indexed.failed.length) throw new Error(`Failed to index ticket IDs: ${indexed.failed.map((item) => item.id).join(", ")}`);
    await deleteTicketDocuments(deletedIds);
    uniqueIds.forEach((id) => pendingTicketIds.delete(id));
    return true;
  } catch (error) {
    uniqueIds.forEach((id) => pendingTicketIds.add(id));
    lastFailure = { at: new Date().toISOString(), message: error instanceof Error ? error.message : String(error) };
    console.warn("Ticket search synchronization deferred", { ticketIds: uniqueIds, error: lastFailure.message });
    return false;
  }
}

export async function retryPendingTicketSync(): Promise<boolean> {
  return syncTicketDocuments([...pendingTicketIds]);
}

export function getSearchSyncState() {
  return { pendingTicketIds: [...pendingTicketIds], pendingCount: pendingTicketIds.size, lastFailure };
}
