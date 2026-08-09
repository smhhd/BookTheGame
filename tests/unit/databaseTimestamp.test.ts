import { parseUtcTimestamp } from "../../src/config/database";

describe("PostgreSQL timestamp parsing", () => {
  it("interprets timestamp-without-time-zone values as UTC on every API host", () => {
    expect(parseUtcTimestamp("2026-08-04 20:43:55.054758").toISOString()).toBe(
      "2026-08-04T20:43:55.054Z"
    );
  });
});
