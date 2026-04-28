import type { Request, Response, NextFunction } from "express";
import { db } from "../db/db.js";
import ApiError from "../utils/api-error.js";
import { users } from "../db/schema/patients-and-users.js";
import { eq } from "drizzle-orm";
import type { safeUser } from "../types/types.js";
import ApiResponse from "../utils/api-response.js";

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, fullName, password, role } = req.body;

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ApiError(
        409,
        "USER_EXISTS",
        "This email is already registered.",
      );
    }

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        userName: fullName,
        passwordHash: password, // TODO: will hash this later
        role,
      })
      .returning();

    if (!newUser) {
      throw new ApiError(500, "DB_ERROR", "Failed to register user");
    }

    const { passwordHash, ...safeUser } = newUser;

    return res
      .status(201)
      .json(
        new ApiResponse<safeUser>(
          201,
          safeUser,
          "User registered successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
  } catch (err: unknown) {}
};

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
  } catch (err: unknown) {}
};
