import type { Response, NextFunction } from "express";
import ApiError from "../utils/api-error.js";
import type { AuthRequest } from "../types/types.js";

export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, _: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "UNAUTHORIZED", "Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "FORBIDDEN",
          `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
        ),
      );
    }

    next();
  };
};
