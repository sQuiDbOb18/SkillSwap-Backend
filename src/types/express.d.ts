import type { AccessTokenPayload } from "../utils/authToken"

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload
    }
  }
}

export {}
