export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Book The Game API",
    version: "4.0.0",
    description: "Phase 4 API backed by PostgreSQL, Elasticsearch search and Redis cache. Monetary values use the database currency unit."
  },
  servers: [{ url: "http://localhost:3000" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    },
    schemas: {
      Success: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { type: "object" }
        }
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          error: {
            type: "object",
            properties: { code: { type: "string" }, details: { type: "array", items: {} } }
          }
        }
      }
    }
  },
  paths: {
    "/health": { get: { summary: "Health check", responses: { "200": { description: "OK" } } } },
    "/health/search": {
      get: {
        summary: "Elasticsearch availability and deferred synchronization state",
        responses: { "200": { description: "Search health snapshot" } }
      }
    },
    "/api/auth/signup": {
      post: {
        summary: "Register spectator",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { "201": { description: "Created" }, "409": { description: "Duplicate contact" } }
      }
    },
    "/api/auth/otp/request": {
      post: { summary: "Request OTP", responses: { "200": { description: "Accepted" } } }
    },
    "/api/auth/otp/verify": {
      post: { summary: "Verify OTP and receive JWT", responses: { "200": { description: "Logged in" } } }
    },
    "/api/users/me": {
      get: { summary: "Current profile", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } },
      patch: { summary: "Update profile", security: [{ bearerAuth: [] }], responses: { "200": { description: "Updated" } } }
    },
    "/api/cities": { get: { summary: "List cities", responses: { "200": { description: "OK" } } } },
    "/api/venues": { get: { summary: "List venues", responses: { "200": { description: "OK" } } } },
    "/api/tickets": {
      get: {
        summary: "Search tickets through Redis and Elasticsearch with PostgreSQL fallback",
        parameters: [
          { in: "query", name: "q", schema: { type: "string", maxLength: 200 }, description: "General text search" },
          { in: "query", name: "team", schema: { type: "string", maxLength: 100 } },
          { in: "query", name: "sport", schema: { type: "string", maxLength: 100 } },
          { in: "query", name: "sportTypeId", schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "homeTeamId", schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "awayTeamId", schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "cityId", schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "venueId", schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "categoryId", schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "status", schema: { type: "string", enum: ["available", "reserved", "sold", "cancelled"] } },
          { in: "query", name: "facility", schema: { type: "string", maxLength: 100 } },
          { in: "query", name: "startDate", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "endDate", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "minPrice", schema: { type: "number", minimum: 0 } },
          { in: "query", name: "maxPrice", schema: { type: "number", minimum: 0 } },
          { in: "query", name: "remainingOnly", schema: { type: "boolean", default: true } },
          { in: "query", name: "sortBy", schema: { type: "string", enum: ["matchDate", "price", "createdAt", "ticketId", "relevance"], default: "matchDate" } },
          { in: "query", name: "sortOrder", schema: { type: "string", enum: ["asc", "desc"], default: "asc" } },
          { in: "query", name: "page", schema: { type: "integer", minimum: 1, default: 1 } },
          { in: "query", name: "limit", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } }
        ],
        responses: {
          "200": { description: "Paginated results with search.source and search.tookMs metadata" },
          "400": { description: "Invalid query" },
          "503": { description: "Search unavailable when fallback is disabled" }
        }
      }
    },
    "/api/tickets/{ticketId}": {
      get: {
        summary: "Ticket details",
        parameters: [{ in: "path", name: "ticketId", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } }
      }
    },
    "/api/reservations": {
      post: {
        summary: "Temporarily reserve exact ticket/seat IDs",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Reserved" }, "409": { description: "Unavailable" } }
      }
    },
    "/api/reservations/active": { get: { summary: "Active reservations", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/api/reservations/history": { get: { summary: "Reservation history", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/api/payments": { post: { summary: "Local order payment by reservation ID", security: [{ bearerAuth: [] }], responses: { "201": { description: "Payment attempt created" } } } },
    "/api/reservations/{reservationId}/cancellation-penalty": { get: { summary: "Preview cancellation penalty", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/api/reservations/{reservationId}/cancel": { post: { summary: "Cancel and refund", security: [{ bearerAuth: [] }], responses: { "200": { description: "Cancelled" } } } },
    "/api/reports": { post: { summary: "Submit ticket, reservation, or payment report", security: [{ bearerAuth: [] }], responses: { "201": { description: "Created" } } } },
    "/api/reports/my": { get: { summary: "My reports", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/api/admin/reports": { get: { summary: "Admin reports", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" }, "403": { description: "Support only" } } } },
    "/api/admin/reports/{id}": { get: { summary: "Admin report details", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/api/admin/reports/{id}/status": { patch: { summary: "Admin update report", security: [{ bearerAuth: [] }], responses: { "200": { description: "Updated" } } } },
    "/api/admin/reservations": { get: { summary: "Admin reservations", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/api/admin/reservations/{id}": { get: { summary: "Admin reservation details", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } },
      patch: { summary: "Use /status subresource", deprecated: true, responses: { "404": { description: "Not implemented" } } } },
    "/api/admin/reservations/{id}/status": { patch: { summary: "Admin update reservation", security: [{ bearerAuth: [] }], responses: { "200": { description: "Updated" } } } },
    "/api/admin/reservations/{id}/ticket": {
      patch: {
        summary: "Admin change a reservation ticket",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ticketId"],
                additionalProperties: false,
                properties: { ticketId: { type: "integer", minimum: 1 } }
              }
            }
          }
        },
        responses: {
          "200": { description: "Ticket changed" },
          "403": { description: "Support only" },
          "404": { description: "Reservation or ticket not found" },
          "409": { description: "Ticket unavailable" }
        }
      }
    },
    "/api/admin/payments/suspicious": { get: { summary: "Heuristic suspicious payments", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } }
  }
} as const;
