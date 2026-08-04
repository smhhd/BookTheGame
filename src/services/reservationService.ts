import { transaction } from "../config/database";
import { bumpTicketCacheVersion } from "../config/redis";
import { env } from "../config/env";
import * as repository from "../repositories/reservationRepository";
import { AppError } from "../utils/AppError";
import { syncTicketDocuments } from "../search/sync";

export async function createReservation(userId: string, ticketIds: number[]) {
  const result = await transaction(async (client) => {
    const user = await client.query<{ status: string }>(
      "SELECT status FROM users WHERE user_id = $1 FOR SHARE",
      [userId]
    );
    if (!user.rows[0]) throw new AppError(404, "USER_NOT_FOUND", "User was not found");
    if (user.rows[0].status !== "active") {
      throw new AppError(403, "ACCOUNT_INACTIVE", "Account is not active");
    }

    const tickets = await repository.lockTickets(client, ticketIds);
    if (tickets.length !== ticketIds.length) {
      throw new AppError(404, "TICKET_NOT_FOUND", "One or more tickets were not found");
    }
    const unavailable = tickets.find((ticket) => ticket.ticket_status !== "available");
    if (unavailable) {
      throw new AppError(409, "TICKET_UNAVAILABLE", `Ticket ${unavailable.ticket_id} is unavailable`);
    }
    const invalidMatch = tickets.find(
      (ticket) =>
        ticket.match_status !== "scheduled" ||
        new Date(ticket.match_datetime).getTime() <= Date.now()
    );
    if (invalidMatch) {
      throw new AppError(
        422,
        "MATCH_NOT_RESERVABLE",
        `Match ${invalidMatch.match_id} cannot be reserved`
      );
    }

    const created = await repository.createOrderWithReservations(
      client,
      userId,
      tickets,
      env.RESERVATION_TTL_MINUTES
    );
    if (created.updatedTicketCount !== tickets.length) {
      throw new AppError(409, "TICKET_UNAVAILABLE", "One or more tickets became unavailable");
    }
    return created;
  });
  await syncTicketDocuments(ticketIds);
  await bumpTicketCacheVersion();
  return result;
}

export function activeReservations(userId: string) {
  return repository.listActiveReservations(userId);
}

export function history(
  userId: string,
  input: { status?: string; page: number; limit: number }
) {
  return repository.listReservationHistory(userId, input.status, input.page, input.limit);
}
