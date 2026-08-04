jest.mock("../../src/config/database", () => ({
  transaction: jest.fn()
}));

jest.mock("../../src/config/redis", () => ({
  bumpTicketCacheVersion: jest.fn(),
  cacheDelete: jest.fn()
}));
jest.mock("../../src/search/sync", () => ({
  syncTicketDocuments: jest.fn().mockResolvedValue(true)
}));

import type { PoolClient } from "pg";
import { transaction } from "../../src/config/database";
import { bumpTicketCacheVersion, cacheDelete } from "../../src/config/redis";
import { pay } from "../../src/services/paymentService";

const transactionMock = jest.mocked(transaction);
const bumpTicketCacheVersionMock = jest.mocked(bumpTicketCacheVersion);
const cacheDeleteMock = jest.mocked(cacheDelete);
const queryMock = jest.fn();
const client = { query: queryMock } as unknown as PoolClient;

describe("wallet payments", () => {
  let walletRowCount: number;
  let timeline: string[];

  beforeEach(() => {
    walletRowCount = 1;
    timeline = [];
    queryMock.mockReset();
    transactionMock.mockReset();
    bumpTicketCacheVersionMock.mockReset();
    cacheDeleteMock.mockReset();

    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM reservations requested")) {
        return {
          rowCount: 1,
          rows: [{
            order_id: "order-1",
            user_id: "user-1",
            status: "pending",
            reserved_until: new Date(Date.now() + 60_000)
          }]
        };
      }
      if (sql.includes("SELECT 1 FROM payments")) {
        return { rowCount: 0, rows: [] };
      }
      if (sql.includes("FROM reservations rs") && sql.includes("JOIN tickets t")) {
        return {
          rowCount: 2,
          rows: [
            { ticket_id: "10", price_at_reservation: "10.00" },
            { ticket_id: "11", price_at_reservation: "20.50" }
          ]
        };
      }
      if (sql.includes("SET wallet_balance = wallet_balance -")) {
        return {
          rowCount: walletRowCount,
          rows: walletRowCount ? [{ wallet_balance: "69.50" }] : []
        };
      }
      if (sql.includes("INSERT INTO payments")) {
        return {
          rowCount: 1,
          rows: [{ payment_id: "payment-1", status: "success" }]
        };
      }
      return { rowCount: 1, rows: [] };
    });

    transactionMock.mockImplementation(async (work) => {
      timeline.push("begin");
      const result = await work(client);
      timeline.push("commit");
      return result;
    });
    bumpTicketCacheVersionMock.mockImplementation(async () => {
      timeline.push("ticket-cache-bump");
    });
    cacheDeleteMock.mockImplementation(async () => {
      timeline.push("profile-cache-delete");
    });
  });

  it("atomically debits a successful wallet payment and invalidates profile cache after commit", async () => {
    await pay({
      userId: "user-1",
      reservationId: 1,
      method: "wallet",
      simulateStatus: "SUCCESS"
    });

    const walletCall = queryMock.mock.calls.find(([sql]) =>
      String(sql).includes("SET wallet_balance = wallet_balance -")
    );
    expect(walletCall?.[0]).toContain("wallet_balance >= $2::numeric");
    expect(walletCall?.[1]).toEqual(["user-1", 30.5]);
    expect(cacheDeleteMock).toHaveBeenCalledWith("profile:user-1");
    expect(timeline.indexOf("commit")).toBeLessThan(timeline.indexOf("profile-cache-delete"));
  });

  it("does not debit the wallet for a failed payment attempt", async () => {
    await pay({
      userId: "user-1",
      reservationId: 1,
      method: "wallet",
      simulateStatus: "FAILED"
    });

    expect(
      queryMock.mock.calls.some(([sql]) =>
        String(sql).includes("SET wallet_balance = wallet_balance -")
      )
    ).toBe(false);
    expect(cacheDeleteMock).not.toHaveBeenCalled();
    expect(bumpTicketCacheVersionMock).not.toHaveBeenCalled();
  });

  it("rejects an insufficient wallet without creating a payment", async () => {
    walletRowCount = 0;

    await expect(pay({
      userId: "user-1",
      reservationId: 1,
      method: "wallet",
      simulateStatus: "SUCCESS"
    })).rejects.toMatchObject({
      status: 422,
      code: "INSUFFICIENT_WALLET_BALANCE"
    });

    expect(
      queryMock.mock.calls.some(([sql]) => String(sql).includes("INSERT INTO payments"))
    ).toBe(false);
    expect(cacheDeleteMock).not.toHaveBeenCalled();
  });
});
