jest.mock("../../src/config/redis", () => ({
  cacheGet: jest.fn(),
  cacheSet: jest.fn(),
  getTicketCacheVersion: jest.fn().mockResolvedValue("1")
}));
jest.mock("../../src/search/ticketSearch", () => ({ searchTicketsInElasticsearch: jest.fn() }));
jest.mock("../../src/repositories/ticketRepository", () => ({
  searchTickets: jest.fn(),
  getTicketDetails: jest.fn()
}));

import { cacheGet, cacheSet } from "../../src/config/redis";
import * as repository from "../../src/repositories/ticketRepository";
import { searchTicketsInElasticsearch } from "../../src/search/ticketSearch";
import { search } from "../../src/services/ticketService";
import { ticketSearchSchema } from "../../src/validators/ticketValidators";

const input = ticketSearchSchema.parse({});

describe("ticket search source and cache", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns and caches Elasticsearch results on cache miss", async () => {
    jest.mocked(cacheGet).mockResolvedValue(null);
    jest.mocked(searchTicketsInElasticsearch).mockResolvedValue({
      items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      search: { source: "elasticsearch", tookMs: 3 }
    });
    const result = await search(input);
    expect(result.search.source).toBe("elasticsearch");
    expect(cacheSet).toHaveBeenCalledTimes(1);
    expect(repository.searchTickets).not.toHaveBeenCalled();
  });

  test("falls back to PostgreSQL without changing the response contract", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    jest.mocked(cacheGet).mockResolvedValue(null);
    jest.mocked(searchTicketsInElasticsearch).mockRejectedValue(new Error("offline"));
    jest.mocked(repository.searchTickets).mockResolvedValue({
      items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    });
    const result = await search(input);
    expect(result.items).toEqual([]);
    expect(result.search.source).toBe("postgresql-fallback");
  });

  test("serves a cache hit without contacting either search backend", async () => {
    jest.mocked(cacheGet).mockResolvedValue({ items: [], pagination: {}, search: { source: "elasticsearch" } });
    const result = await search(input);
    expect(result.cacheHit).toBe(true);
    expect(searchTicketsInElasticsearch).not.toHaveBeenCalled();
    expect(repository.searchTickets).not.toHaveBeenCalled();
  });
});
