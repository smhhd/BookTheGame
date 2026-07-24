import { stableCacheKey } from "../../src/utils/cacheKey";

describe("stableCacheKey", () => {
  it("is independent from object key order", () => {
    expect(stableCacheKey("search", { cityId: 1, page: 2 })).toBe(
      stableCacheKey("search", { page: 2, cityId: 1 })
    );
  });
  it("changes when a filter changes", () => {
    expect(stableCacheKey("search", { cityId: 1 })).not.toBe(
      stableCacheKey("search", { cityId: 2 })
    );
  });
});
