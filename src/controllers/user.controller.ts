import type { Request, Response, NextFunction } from "express";
import { db } from "../db/db.js";
import ApiError from "../utils/api-error.js";
import { users } from "../db/schema/patients-and-users.js";
import { eq } from "drizzle-orm";
import type { SafeUser, UserLoginResponse } from "../types/types.js";
import ApiResponse from "../utils/api-response.js";
import { compare, hash } from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET = process.env.SECRET as string;

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

    // hash the password
    const hashPassword = await hash(password, 12);
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        userName: fullName,
        passwordHash: hashPassword,
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
        new ApiResponse<SafeUser>(
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
) => {
  try {
    const { email, password } = req.body;
    const [foundUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!foundUser) {
      return next(new ApiError(400, "INVALID", "email or password incorrect"));
    }

    const isMatched = await compare(password, foundUser.passwordHash);
    if (!isMatched) {
      return next(new ApiError(400, "INVALID", "email or password incorrect"));
    }

    const accessToken = jwt.sign(
      {
        data: {
          userId: foundUser.id,
          role: foundUser.role,
        },
      },
      SECRET,
      { expiresIn: "12h" },
    );

    const loginResponse = {
      userName: foundUser.userName,
      email: foundUser.email,
      role: foundUser.role,
      accessToken: accessToken,
    };
    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse<UserLoginResponse>(
          200,
          loginResponse,
          "User logged in successfully",
        ),
      );
  } catch (error) {
    return next(error);
  }
};

export const logoutUser = async (
  _: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "strict" as const,
    };

    // these are the powerful http header for clearing data of the origin also i donot know it work on http or just on https
    res.setHeader("Clear-Site-Data", '"cache", "cookies", "storage"');

    return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .json(new ApiResponse(200, null, "User logged out successfully"));
  } catch (error) {
    return next(error);
  }
};

// TODO: Robust Error handling
// TODO: schema validation
