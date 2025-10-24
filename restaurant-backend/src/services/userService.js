import {
  getAllUsersModel,
  getUserByIdModel,
  createUserModel,
  deleteUserModel,
  loginUserModel,
  updateOwnCredentialsModel,
  adminUpdateCredentialsModel,
} from "../models/userModel.js";
import { generateToken } from "../middlewares/authentication.js";
import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

/**
 * User Service Layer
 * Contains business logic for user operations
 * Separates business logic from HTTP request/response handling
 */

export class UserNotFoundError extends Error {
  constructor(message = "User not found") {
    super(message);
    this.name = "UserNotFoundError";
    this.statusCode = 404;
  }
}
export class InvalidCredentialsError extends Error {
  constructor(message = "Invalid credentials") {
    super(message);
    this.name = "InvalidCredentialsError";
    this.statusCode = 401;
  }
}
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized access") {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 403;
  }
}
export class ValidationError extends Error {
  constructor(message = "Validation failed") {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

const normalizeUserFields = (user) => {
  if (!user) return null;

  return {
    user_id: user.user_id,
    user_name: user.user_name,
    role_id: user.role_id,
    email: user.email,
    phone: user.phone,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

const generateUserToken = (user) => {
  const normalizedUser = normalizeUserFields(user);

  return generateToken({
    userId: normalizedUser.user_id,
    user_name: normalizedUser.user_name,
    role_id: normalizedUser.role_id,
  });
};

export const createUserService = async (userData) => {
  try {
    const newUser = await createUserModel(userData);
    return normalizeUserFields(newUser);
  } catch (error) {
    if (error.code === "23505") {
      // Check which field caused the unique constraint violation
      if (error.constraint === "users_user_name_key") {
        throw new ValidationError(
          "This username is already taken. Please choose a different username."
        );
      } else if (error.constraint === "users_email_key") {
        throw new ValidationError(
          "This email address is already in use. Please choose a different email address."
        );
      } else {
        throw new ValidationError("Username or email address already exists.");
      }
    }
    throw error;
  }
};

export const authenticateUserService = async (user_name, password) => {
  try {
    const user = await loginUserModel(user_name, password);

    if (!user) {
      throw new InvalidCredentialsError("Invalid username or password");
    }

    const normalizedUser = normalizeUserFields(user);
    const token = generateUserToken(normalizedUser);

    return {
      user: {
        user_id: normalizedUser.user_id,
        user_name: normalizedUser.user_name,
        role_id: normalizedUser.role_id,
      },
      token,
      fullUser: normalizedUser,
    };
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      throw error;
    }
    throw new Error("Authentication service error");
  }
};

export const getAllUsersBusinessService = async () => {
  try {
    const users = await getAllUsersModel();
    return users.map((user) => normalizeUserFields(user));
  } catch (error) {
    throw new Error("Failed to fetch users");
  }
};

export const getUserByIdBusinessService = async (userId) => {
  try {
    const user = await getUserByIdModel(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    return normalizeUserFields(user);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      throw error;
    }
    throw new Error("Failed to fetch user");
  }
};

export const deleteUserBusinessService = async (userId) => {
  try {
    const deletedUser = await deleteUserModel(userId);

    if (!deletedUser) {
      throw new UserNotFoundError();
    }

    return normalizeUserFields(deletedUser);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      throw error;
    }
    throw new Error("Failed to delete user");
  }
};

export const updateOwnCredentialsBusinessService = async (
  userId,
  currentPassword,
  updates
) => {
  try {
    // Check if user exists
    const userResult = await pool.query(
      "SELECT password FROM users WHERE user_id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error("User not found");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password
    );
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Check if username already exists (if changing username)
    if (updates.user_name) {
      const existingUser = await pool.query(
        "SELECT user_id FROM users WHERE user_name = $1 AND user_id != $2",
        [updates.user_name, userId]
      );

      if (existingUser.rows.length > 0) {
        throw new Error("Username already exists");
      }
    }

    // Check if email already exists (if changing email)
    if (updates.email !== undefined && updates.email !== "") {
      const existingEmail = await pool.query(
        "SELECT user_id FROM users WHERE email = $1 AND user_id != $2",
        [updates.email, userId]
      );

      if (existingEmail.rows.length > 0) {
        throw new Error("Email already exists");
      }
    }

    let updatedUser;
    try {
      updatedUser = await updateOwnCredentialsModel(
        userId,
        currentPassword,
        updates
      );
    } catch (modelError) {
      throw modelError;
    }

    const normalizedUser = normalizeUserFields(updatedUser);
    const newToken = generateUserToken(normalizedUser);

    const result = {
      user: normalizedUser,
      token: newToken,
    };

    return result;
  } catch (error) {
    if (error.message === "Current password is incorrect") {
      throw new ValidationError("Current password is incorrect");
    }
    if (error.message === "User not found") {
      throw new UserNotFoundError();
    }
    if (error.message === "Username already exists") {
      throw new ValidationError(
        "This username is already taken. Please choose a different username."
      );
    }
    if (error.message === "Email already exists") {
      throw new ValidationError(
        "This email address is already in use. Please choose a different email address."
      );
    }
    throw new Error("Failed to update credentials");
  }
};

export const adminUpdateCredentialsBusinessService = async (
  targetUserId,
  updates,
  currentAdminId
) => {
  try {
    const updatedUser = await adminUpdateCredentialsModel(
      targetUserId,
      updates
    );
    const normalizedUser = normalizeUserFields(updatedUser);

    let result = { user: normalizedUser };

    if (parseInt(targetUserId) === parseInt(currentAdminId)) {
      const newToken = generateUserToken(normalizedUser);
      result.token = newToken;
      result.tokenUpdated = true;
    }

    return result;
  } catch (error) {
    if (error.message === "User not found") {
      throw new UserNotFoundError();
    }
    if (error.message === "No fields to update") {
      throw new ValidationError("No fields to update");
    }
    if (error.message === "Username already exists") {
      throw new ValidationError(
        "This username is already taken. Please choose a different username."
      );
    }
    if (error.message === "Email already exists") {
      throw new ValidationError(
        "This email address is already in use. Please choose a different email address."
      );
    }
    throw new Error("Failed to update user credentials");
  }
};

export const getCookieConfig = () => ({
  httpOnly: false, // 
  secure: process.env.NODE_ENV === "production",
  sameSite: "None",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
});
