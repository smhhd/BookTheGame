import { signupSchema } from "../../src/validators/authValidators";
import { ticketSearchSchema } from "../../src/validators/ticketValidators";

describe("request validation", () => {
  it("rejects weak signup passwords", () => {
    expect(() =>
      signupSchema.parse({
        firstName: "A",
        lastName: "B",
        email: "a@example.com",
        password: "weak"
      })
    ).toThrow();
  });
  it("rejects unknown sensitive signup fields", () => {
    expect(() =>
      signupSchema.parse({
        firstName: "A",
        lastName: "B",
        email: "a@example.com",
        password: "Strong123",
        role: "support"
      })
    ).toThrow();
  });
  it("rejects unsupported sort columns", () => {
    expect(() => ticketSearchSchema.parse({ sortBy: "price; DROP TABLE users" })).toThrow();
  });
  it("bounds pagination", () => {
    expect(() => ticketSearchSchema.parse({ limit: 101 })).toThrow();
  });
});
