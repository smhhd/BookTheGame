jest.mock("../../src/config/database", () => ({
  query: jest.fn(),
  transaction: jest.fn()
}));
jest.mock("../../src/config/redis", () => ({
  bumpTicketCacheVersion: jest.fn()
}));
jest.mock("../../src/search/sync", () => ({
  syncTicketDocuments: jest.fn().mockResolvedValue(true)
}));

import { transaction } from "../../src/config/database";
import { bumpTicketCacheVersion } from "../../src/config/redis";
import { changeReservationTicket } from "../../src/services/adminService";
import { AppError } from "../../src/utils/AppError";

const mockedTransaction = jest.mocked(transaction);
const mockedBumpTicketCacheVersion = jest.mocked(bumpTicketCacheVersion);

describe("admin reservation ticket change", () => {
  const client = { query: jest.fn() };
  const future = () => new Date(Date.now() + 60_000);

  beforeEach(() => {
    client.query.mockReset();
    mockedTransaction.mockImplementation(async (work) => work(client as never));
  });

  it("atomically moves a pending reservation to an available ticket of the same match", async () => {
    client.query
      .mockResolvedValueOnce({ rows: [{ order_id: "20" }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ status: "pending", reserved_until: future() }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ status: "pending", ticket_id: "10" }], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [
          { ticket_id: "10", match_id: "7", price: "100.00", status: "reserved" },
          { ticket_id: "11", match_id: "7", price: "125.00", status: "available" }
        ],
        rowCount: 2
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    await expect(changeReservationTicket(4, 11, "2")).resolves.toEqual({
      reservationId: 4,
      oldTicketId: "10",
      ticketId: 11,
      priceAtReservation: "125.00",
      status: "pending",
      reviewedBy: "2"
    });

    expect(client.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("ORDER BY ticket_id"),
      [["10", 11]]
    );
    expect(client.query).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining("status = 'reserved'"),
      [11]
    );
    expect(client.query).toHaveBeenNthCalledWith(
      6,
      expect.stringContaining("price_at_reservation = $3"),
      [4, 11, "125.00"]
    );
    expect(client.query).toHaveBeenNthCalledWith(
      7,
      expect.stringContaining("status = 'available'"),
      ["10"]
    );
    expect(mockedBumpTicketCacheVersion).toHaveBeenCalledTimes(1);
  });

  it("rejects a replacement ticket from another match without mutating or invalidating cache", async () => {
    client.query
      .mockResolvedValueOnce({ rows: [{ order_id: "20" }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ status: "pending", reserved_until: future() }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ status: "pending", ticket_id: "10" }], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [
          { ticket_id: "10", match_id: "7", price: "100.00", status: "reserved" },
          { ticket_id: "11", match_id: "8", price: "125.00", status: "available" }
        ],
        rowCount: 2
      });

    const error = await changeReservationTicket(4, 11, "2").catch((caught) => caught);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ status: 422, code: "TICKET_MATCH_MISMATCH" });
    expect(client.query).toHaveBeenCalledTimes(4);
    expect(mockedBumpTicketCacheVersion).not.toHaveBeenCalled();
  });

  it("rejects a non-pending reservation before locking tickets", async () => {
    client.query
      .mockResolvedValueOnce({ rows: [{ order_id: "20" }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ status: "pending", reserved_until: future() }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ status: "paid", ticket_id: "10" }], rowCount: 1 });

    const error = await changeReservationTicket(4, 11, "2").catch((caught) => caught);

    expect(error).toMatchObject({ status: 422, code: "INVALID_STATUS_TRANSITION" });
    expect(client.query).toHaveBeenCalledTimes(3);
    expect(mockedBumpTicketCacheVersion).not.toHaveBeenCalled();
  });

  it("rejects a replacement ticket that is not available", async () => {
    client.query
      .mockResolvedValueOnce({ rows: [{ order_id: "20" }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ status: "pending", reserved_until: future() }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ status: "pending", ticket_id: "10" }], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [
          { ticket_id: "10", match_id: "7", price: "100.00", status: "reserved" },
          { ticket_id: "11", match_id: "7", price: "125.00", status: "sold" }
        ],
        rowCount: 2
      });

    const error = await changeReservationTicket(4, 11, "2").catch((caught) => caught);

    expect(error).toMatchObject({ status: 409, code: "TICKET_UNAVAILABLE" });
    expect(client.query).toHaveBeenCalledTimes(4);
    expect(mockedBumpTicketCacheVersion).not.toHaveBeenCalled();
  });
});
