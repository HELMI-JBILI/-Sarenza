import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "./errorHandler";

export interface AuthedRequest extends Request {
  admin?: { id: string; email: string };
}

export function requireAdmin(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHORIZED", "Admin authentication required.");
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      email: string;
    };
    req.admin = payload;
    next();
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired session.");
  }
}
