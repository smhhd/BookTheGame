const mockConnectRedis = jest.fn();
const mockRedisIncr = jest.fn();
const mockRedisExpire = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisEval = jest.fn();
const mockFindUserByIdentifier = jest.fn();
const mockSendVerificationCode = jest.fn();
const mockIssueToken = jest.fn();

jest.mock("../../src/config/redis", () => ({
  connectRedis: mockConnectRedis,
  redis: {
    incr: mockRedisIncr,
    expire: mockRedisExpire,
    set: mockRedisSet,
    eval: mockRedisEval
  }
}));
jest.mock("../../src/repositories/userRepository", () => ({
  contactExists: jest.fn(),
  createUser: jest.fn(),
  findUserByIdentifier: mockFindUserByIdentifier,
  toPublicUser: (user: Record<string, unknown>) => {
    const safe = { ...user };
    delete safe.password_hash;
    return safe;
  }
}));
jest.mock("../../src/services/emailService", () => ({
  sendVerificationCode: mockSendVerificationCode
}));
jest.mock("../../src/services/tokenService", () => ({
  issueToken: mockIssueToken
}));

import {
  OTP_DELETE_IF_HASH_MATCHES_SCRIPT,
  OTP_MARK_DELIVERED_IF_HASH_MATCHES_SCRIPT,
  requestOtp,
  verifyOtp
} from "../../src/services/authService";

const user = {
  user_id: "42",
  role_name: "spectator" as const,
  city_id: null,
  first_name: "Test",
  last_name: "User",
  email: "account@example.com",
  phone: "+989121234567",
  password_hash: "not-returned",
  profile_image_url: null,
  birth_date: null,
  wallet_balance: "0",
  status: "active" as const,
  registered_at: new Date("2026-01-01T00:00:00Z")
};

describe("OTP email delivery", () => {
  beforeEach(() => {
    mockConnectRedis.mockResolvedValue(true);
    mockRedisIncr.mockResolvedValue(1);
    mockRedisExpire.mockResolvedValue(true);
    mockRedisSet.mockResolvedValue("OK");
    mockRedisEval.mockResolvedValue(1);
    mockFindUserByIdentifier.mockResolvedValue(user);
    mockSendVerificationCode.mockResolvedValue(undefined);
    mockIssueToken.mockReturnValue("safe-jwt");
  });

  it("stores a hashed OTP before sending it to the user's registered email", async () => {
    const response = await requestOtp(user.phone);

    expect(response).toEqual({ expiresInSeconds: 300 });
    expect(response).not.toHaveProperty("devOtp");
    expect(mockRedisSet).toHaveBeenCalledWith(
      `otp:phone:${user.phone}`,
      expect.any(String),
      { EX: 300 }
    );
    const stored = JSON.parse(mockRedisSet.mock.calls[0]![1]);
    expect(stored).toEqual({
      hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      attempts: 0,
      delivered: false
    });
    expect(mockSendVerificationCode).toHaveBeenCalledWith({
      to: user.email,
      code: expect.stringMatching(/^\d{6}$/),
      expiresInSeconds: 300
    });
    expect(stored.hash).not.toBe(mockSendVerificationCode.mock.calls[0]![0].code);
    expect(mockRedisEval).toHaveBeenCalledWith(OTP_MARK_DELIVERED_IF_HASH_MATCHES_SCRIPT, {
      keys: [`otp:phone:${user.phone}`],
      arguments: [stored.hash]
    });
    expect(mockRedisSet.mock.invocationCallOrder[0]).toBeLessThan(
      mockSendVerificationCode.mock.invocationCallOrder[0]!
    );
  });

  it("does not generate or store a code for an unknown account", async () => {
    mockFindUserByIdentifier.mockResolvedValue(null);

    await expect(requestOtp("missing@example.com")).resolves.toEqual({
      expiresInSeconds: 300
    });
    expect(mockRedisSet).not.toHaveBeenCalled();
    expect(mockSendVerificationCode).not.toHaveBeenCalled();
  });

  it("removes the undelivered OTP when SMTP fails", async () => {
    mockSendVerificationCode.mockRejectedValue(new Error("SMTP unavailable"));

    await expect(requestOtp(user.email)).rejects.toMatchObject({
      status: 503,
      code: "OTP_DELIVERY_FAILED"
    });
    const stored = JSON.parse(mockRedisSet.mock.calls[0]![1]);
    expect(mockRedisEval).toHaveBeenCalledWith(OTP_DELETE_IF_HASH_MATCHES_SCRIPT, {
      keys: [`otp:email:${user.email}`],
      arguments: [stored.hash]
    });
  });

  it("keeps the undelivered OTP inactive even if Redis cleanup also fails", async () => {
    mockSendVerificationCode.mockRejectedValue(new Error("SMTP unavailable"));
    mockRedisEval.mockRejectedValue(new Error("Redis unavailable during cleanup"));

    await expect(requestOtp(user.email)).rejects.toMatchObject({
      status: 503,
      code: "OTP_DELIVERY_FAILED"
    });
    expect(JSON.parse(mockRedisSet.mock.calls[0]![1])).toEqual(expect.objectContaining({
      delivered: false
    }));
  });

  it("does not report success unless Redis activates the delivered code", async () => {
    mockRedisEval.mockResolvedValue(0);

    await expect(requestOtp(user.email)).rejects.toMatchObject({
      status: 503,
      code: "OTP_STORE_UNAVAILABLE"
    });
  });

  it("does not send email when Redis is unavailable", async () => {
    mockConnectRedis.mockResolvedValue(false);

    await expect(requestOtp(user.email)).rejects.toMatchObject({
      status: 503,
      code: "OTP_STORE_UNAVAILABLE"
    });
    expect(mockRedisSet).not.toHaveBeenCalled();
    expect(mockSendVerificationCode).not.toHaveBeenCalled();
  });

  it("keeps correct OTP verification one-time and returns no secret fields", async () => {
    mockRedisEval.mockResolvedValue(1);

    const response = await verifyOtp(user.email, "482913");

    expect(response).toEqual({
      user: expect.not.objectContaining({ password_hash: expect.anything() }),
      token: "safe-jwt"
    });
  });

  it.each([
    ["wrong", -1],
    ["expired", 0],
    ["already used", 0]
  ])("rejects a %s OTP exactly as before", async (_case, outcome) => {
    mockRedisEval.mockResolvedValue(outcome);

    await expect(verifyOtp(user.email, "000000")).rejects.toMatchObject({
      status: 401,
      code: "OTP_INVALID_OR_EXPIRED"
    });
  });
});
