import cron from "node-cron";
import { env } from "../config/env";
import { expireReservations } from "../services/expirationService";

export function startExpirationJob() {
  return cron.schedule(env.EXPIRATION_JOB_CRON, () => {
    void expireReservations()
      .then((result) => {
        console.info("Reservation expiration batch completed", {
          expiredOrders: result.expiredOrders,
          releasedTickets: result.releasedTicketIds.length
        });
      })
      .catch((error: unknown) => {
        console.error("Reservation expiration batch failed", {
          message: error instanceof Error ? error.message : String(error)
        });
      });
  });
}
