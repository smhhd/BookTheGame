import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { JwtPayload } from "../types";

export function issueToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    subject: payload.userId
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "string" ||
    (decoded.role !== "spectator" && decoded.role !== "support")
  ) {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }
  return { userId: decoded.userId, role: decoded.role };
}
