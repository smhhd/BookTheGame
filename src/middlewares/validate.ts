import { RequestHandler } from "express";
import { ZodType } from "zod";

export function validate(
  schemas: Partial<Record<"body" | "query" | "params", ZodType>>
): RequestHandler {
  return (request, _response, next) => {
    for (const [location, schema] of Object.entries(schemas)) {
      const key = location as "body" | "query" | "params";
      const parsed = schema.parse(request[key]);
      if (key === "query") {
        // Express 5 exposes req.query through a getter without a setter.
        Object.defineProperty(request, "query", {
          value: parsed,
          configurable: true,
          enumerable: true,
          writable: true
        });
      } else {
        request[key] = parsed;
      }
    }
    next();
  };
}
