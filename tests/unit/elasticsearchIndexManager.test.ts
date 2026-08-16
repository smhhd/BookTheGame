jest.mock("../../src/search/client", () => {
  class ElasticsearchRequestError extends Error {
    constructor(message: string, public status?: number) { super(message); }
  }
  return { elasticRequest: jest.fn(), ElasticsearchRequestError };
});

import { elasticRequest, ElasticsearchRequestError } from "../../src/search/client";
import { bulkIndexTickets, createTicketIndex, deleteTicketDocuments } from "../../src/search/indexManager";

const mockedRequest = jest.mocked(elasticRequest);

beforeEach(() => mockedRequest.mockReset());

test("creates the strict index when it does not exist", async () => {
  mockedRequest.mockRejectedValueOnce(new ElasticsearchRequestError("missing", 404)).mockResolvedValueOnce({} as never);
  await expect(createTicketIndex(false)).resolves.toMatchObject({ created: true });
  expect(mockedRequest.mock.calls[0]?.[1]).toMatchObject({ method: "HEAD" });
  expect(mockedRequest.mock.calls[1]?.[1]).toMatchObject({ method: "PUT" });
});

test("bulk upsert uses stable IDs and reports individual errors", async () => {
  mockedRequest.mockResolvedValue({
    errors: true,
    items: [
      { index: { _id: "1", status: 201 } },
      { index: { _id: "2", status: 400, error: { reason: "invalid" } } }
    ]
  } as never);
  const result = await bulkIndexTickets([{ ticketId: "1" }, { ticketId: "2" }] as any);
  expect(result).toEqual({ successful: 1, failed: [{ id: "2", reason: "invalid" }] });
  const body = String((mockedRequest.mock.calls[0]?.[1] as { rawBody: string }).rawBody);
  expect(body).toContain('"_id":"1"');
  expect(body).toContain('"_id":"2"');
});

test("deletes documents through the bulk API", async () => {
  mockedRequest.mockResolvedValue({} as never);
  await deleteTicketDocuments([4, 5]);
  const body = String((mockedRequest.mock.calls[0]?.[1] as { rawBody: string }).rawBody);
  expect(body).toContain('"delete"');
  expect(body).toContain('"_id":"4"');
});
