import { buildTicketSearchBody } from "../../src/search/ticketSearch";
import { ticketIndexDefinition } from "../../src/search/mapping";
import { ticketSearchSchema } from "../../src/validators/ticketValidators";

describe("Elasticsearch ticket query", () => {
  test("builds text, exact, range, pagination and sort clauses", () => {
    const input = ticketSearchSchema.parse({
      q: "جام تهران",
      team: "استقلال",
      sportTypeId: "1",
      cityId: "2",
      facility: "پارکینگ",
      minPrice: "100",
      maxPrice: "500",
      startDate: "2030-01-01T00:00:00+03:30",
      page: "2",
      limit: "10",
      sortBy: "price",
      sortOrder: "desc",
      remainingOnly: "false"
    });
    const body = buildTicketSearchBody(input) as any;
    expect(body.from).toBe(10);
    expect(body.size).toBe(10);
    expect(body.track_total_hits).toBe(true);
    expect(body.sort[0]).toEqual({ price: "desc" });
    expect(body.query.bool.must).toHaveLength(2);
    expect(body.query.bool.filter).toEqual(expect.arrayContaining([
      { term: { sportTypeId: "1" } },
      { term: { cityId: "2" } },
      { term: { facilityNames: "پارکینگ" } },
      { range: { price: { gte: 100, lte: 500 } } }
    ]));
  });

  test("uses strict explicit mapping and keyword IDs", () => {
    expect(ticketIndexDefinition.mappings.dynamic).toBe("strict");
    expect(ticketIndexDefinition.mappings.properties.ticketId.type).toBe("keyword");
    expect(ticketIndexDefinition.mappings.properties.price.type).toBe("scaled_float");
    expect(ticketIndexDefinition.mappings.properties.matchDatetime.type).toBe("date");
  });
});
