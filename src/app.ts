import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { openapi } from "./docs/openapi";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { adminRoutes } from "./routes/adminRoutes";
import { authRoutes } from "./routes/authRoutes";
import { catalogRoutes } from "./routes/catalogRoutes";
import { paymentRoutes } from "./routes/paymentRoutes";
import { reportRoutes } from "./routes/reportRoutes";
import { reservationRoutes } from "./routes/reservationRoutes";
import { ticketRoutes } from "./routes/ticketRoutes";
import { userRoutes } from "./routes/userRoutes";
import { elasticsearchHealth } from "./search/client";
import { getSearchSyncState } from "./search/sync";
import { asyncHandler } from "./utils/asyncHandler";

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: false
  })
);
app.use(express.json({ limit: env.BODY_LIMIT }));

app.get("/health", (_request, response) => {
  response.json({ success: true, message: "Service is healthy", data: {} });
});
app.get("/health/search", asyncHandler(async (_request, response) => {
  response.json({
    success: true,
    message: "Search health checked",
    data: { elasticsearch: await elasticsearchHealth(), synchronization: getSearchSyncState() }
  });
}));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", catalogRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
