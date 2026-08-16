import request from "supertest";
import { app } from "../../src/app";

describe("HTTP contract without external services", () => {
  it("returns the standard health response", async () => {
    const response = await request(app).get("/health").expect(200);
    expect(response.body).toEqual({
      success: true,
      message: "Service is healthy",
      data: {}
    });
  });
  it("rejects an invalid JWT with the standard error shape", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer invalid")
      .expect(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("INVALID_TOKEN");
  });
});
