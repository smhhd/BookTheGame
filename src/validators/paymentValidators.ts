import { z } from "zod";
import { id } from "./common";

export const paymentSchema = z
  .object({
    reservationId: id,
    method: z
      .enum(["bank_card", "wallet", "crypto", "CARD", "WALLET", "CRYPTO"])
      .transform((value) => {
        const map: Record<string, "bank_card" | "wallet" | "crypto"> = {
          CARD: "bank_card",
          WALLET: "wallet",
          CRYPTO: "crypto",
          bank_card: "bank_card",
          wallet: "wallet",
          crypto: "crypto"
        };
        return map[value]!;
      }),
    simulateStatus: z.enum(["SUCCESS", "FAILED"]).default("SUCCESS")
  })
  .strict();
