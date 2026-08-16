export type RoleName = "spectator" | "support";

export interface AuthenticatedUser {
  userId: string;
  role: RoleName;
}

export interface JwtPayload {
  userId: string;
  role: RoleName;
}
