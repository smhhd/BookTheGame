import { closeDatabase } from "../config/database";
import { closeRedis } from "../config/redis";
import { expireReservations } from "../services/expirationService";

async function main() {
  const result = await expireReservations();
  console.info("Reservation expiration run completed", result);
}

void main()
  .catch((error) => {
    console.error("Reservation expiration run failed", {
      message: error instanceof Error ? error.message : String(error)
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([closeDatabase(), closeRedis()]);
  });
