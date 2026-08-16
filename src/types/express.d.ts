import type { AuthenticatedUser } from "./index";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

export {};
