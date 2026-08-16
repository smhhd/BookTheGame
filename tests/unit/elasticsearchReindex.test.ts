jest.mock("../../src/search/indexManager", () => ({
  createTicketIndex: jest.fn(),
  bulkIndexTickets: jest.fn()
}));
jest.mock("../../src/search/repository", () => ({ listSearchDocuments: jest.fn() }));

import { bulkIndexTickets, createTicketIndex } from "../../src/search/indexManager";
import { reindexAllTickets } from "../../src/search/reindex";
import { listSearchDocuments } from "../../src/search/repository";

const document = (ticketId: string) => ({ ticketId }) as any;

test("reindex reads batches and reports exact counts", async () => {
  jest.mocked(listSearchDocuments)
    .mockResolvedValueOnce([document("1"), document("2")])
    .mockResolvedValueOnce([]);
  jest.mocked(bulkIndexTickets).mockResolvedValue({ successful: 1, failed: [{ id: "2", reason: "bad" }] });
  const summary = await reindexAllTickets({ recreate: true });
  expect(createTicketIndex).toHaveBeenCalledWith(true);
  expect(bulkIndexTickets).toHaveBeenCalledWith([document("1"), document("2")]);
  expect(summary).toEqual({ read: 2, successful: 1, failed: [{ id: "2", reason: "bad" }] });
});
