jest.mock("../../src/config/database", () => ({
  query: jest.fn(),
  transaction: jest.fn()
}));

import { query } from "../../src/config/database";
import { myReports } from "../../src/services/reportService";

const queryMock = query as jest.MockedFunction<typeof query>;

describe("myReports", () => {
  it("selects and returns the support response", async () => {
    const report = {
      report_id: 1,
      support_response: "The issue was reviewed by support."
    };
    queryMock.mockResolvedValue({
      rows: [report],
      rowCount: 1,
      command: "SELECT",
      oid: 0,
      fields: []
    });

    const result = await myReports("user-1");

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining("r.support_response"),
      ["user-1"]
    );
    expect(result).toEqual([report]);
  });
});
