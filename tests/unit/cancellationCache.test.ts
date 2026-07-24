jest.mock("../../src/config/database", () => ({
  transaction: jest.fn(),
  query: jest.fn()
}));

jest.mock("../../src/config/redis", () => ({
  bumpTicketCacheVersion: jest.fn(),
  cacheDelete: jest.fn()
}));

import type { PoolClient } from "pg";
import { transaction } from "../../src/config/database";
import { bumpTicketCacheVersion, cacheDelete } from "../../src/config/redis";
import { cancel } from "../../src/services/cancellationService";

const transactionMock = jest.mocked(transaction);
const bumpTicketCacheVersionMock = jest.mocked(bumpTicketCacheVersion);
const cacheDeleteMock = jest.mocked(cacheDelete);
const queryMock = jest.fn();
const client = { query: queryMock } as unknown as PoolClient;

describe("cancellation refund cache", () => {
  beforeEach(() => {
    const timeline: string[] = [];
    queryMock.mockReset();
    transactionMock.mockReset();
    bumpTicketCacheVersionMock.mockReset();
    cacheDeleteMock.mockReset();

    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM reservations rs") && sql.includes("cancellation_policies")) {
        return {
          rowCount: 1,
          rows: [{
            reservation_id: "1",
            order_id: "order-1",
            user_id: "owner-7",
            reservation_status: "paid",
            ticket_id: "ticket-1",
            match_id: "match-1",
            match_datetime: new Date(Date.now() + 86_400_000),
            organizer_id: "organizer-1",
            sport_type_id: 1,
            price_at_reservation: "75.00",
            policy_id: null,
            rule_id: null,
            penalty_percent: "0"
          }]
        };
      }
      if (sql.includes("INSERT INTO cancellation_requests")) {
        return { rowCount: 1, rows: [{ request_id: "request-1" }] };
      }
      if (sql.includes("SELECT payment_id FROM payments")) {
        return { rowCount: 1, rows: [{ payment_id: "payment-1" }] };
      }
      if (sql.includes("INSERT INTO refunds")) {
        return {
          rowCount: 1,
          rows: [{ refund_id: "refund-1", amount: "75.00", status: "success" }]
        };
      }
      if (sql.includes("SET wallet_balance = wallet_balance +")) {
        return { rowCount: 1, rows: [{ wallet_balance: "100.00" }] };
      }
      if (sql.includes("count(*) FILTER")) {
        return { rowCount: 1, rows: [{ pending_count: "0", paid_count: "0" }] };
      }
      return { rowCount: 1, rows: [] };
    });

    transactionMock.mockImplementation(async (work) => {
      timeline.push("begin");
      const result = await work(client);
      timeline.push("commit");
      return result;
    });
    bumpTicketCacheVersionMock.mockResolvedValue();
    cacheDeleteMock.mockImplementation(async () => {
      expect(timeline).toContain("commit");
    });
  });

  it("invalidates the reservation owner's profile after a support refund commits", async () => {
    await cancel(1, "support-2", "support", "support cancellation");

    const walletCall = queryMock.mock.calls.find(([sql]) =>
      String(sql).includes("SET wallet_balance = wallet_balance +")
    );
    expect(walletCall?.[1]).toEqual(["owner-7", 75]);
    expect(cacheDeleteMock).toHaveBeenCalledTimes(1);
    expect(cacheDeleteMock).toHaveBeenCalledWith("profile:owner-7");
    expect(cacheDeleteMock).not.toHaveBeenCalledWith("profile:support-2");
  });
});
