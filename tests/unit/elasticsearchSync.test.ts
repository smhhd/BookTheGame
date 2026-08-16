jest.mock("../../src/search/indexManager", () => ({
  createTicketIndex: jest.fn(),
  bulkIndexTickets: jest.fn(),
  deleteTicketDocuments: jest.fn()
}));
jest.mock("../../src/search/repository", () => ({ getSearchDocuments: jest.fn() }));

import { bulkIndexTickets, createTicketIndex, deleteTicketDocuments } from "../../src/search/indexManager";
import { getSearchDocuments } from "../../src/search/repository";
import { getSearchSyncState, syncTicketDocuments } from "../../src/search/sync";

beforeEach(() => jest.clearAllMocks());

test("upserts existing rows and removes deleted rows after commit", async () => {
  jest.mocked(createTicketIndex).mockResolvedValue({ created: false, index: "tickets" });
  jest.mocked(getSearchDocuments).mockResolvedValue([{ ticketId: "1" }] as any);
  jest.mocked(bulkIndexTickets).mockResolvedValue({ successful: 1, failed: [] });
  await expect(syncTicketDocuments([1, 2, 1])).resolves.toBe(true);
  expect(bulkIndexTickets).toHaveBeenCalledWith([{ ticketId: "1" }]);
  expect(deleteTicketDocuments).toHaveBeenCalledWith(["2"]);
});

test("makes a failed synchronization observable without failing the SQL operation", async () => {
  jest.spyOn(console, "warn").mockImplementation(() => undefined);
  jest.mocked(createTicketIndex).mockRejectedValue(new Error("offline"));
  await expect(syncTicketDocuments([99])).resolves.toBe(false);
  expect(getSearchSyncState()).toMatchObject({ pendingCount: 1, pendingTicketIds: ["99"] });
});
