import {
  createUserService,
  authenticateUserService,
  getAllUsersBusinessService,
  getUserByIdBusinessService,
  deleteUserBusinessService,
  updateOwnCredentialsBusinessService,
  adminUpdateCredentialsBusinessService,
  getCookieConfig,
  UserNotFoundError,
  InvalidCredentialsError,
  UnauthorizedError,
  ValidationError,
} from "../services/userService.js";
import { addTokenToBlacklistService } from "../models/tokenBlacklistModel.js";


const handleResponse = (res, status, success, data, message) => {
  res.status(status).json({
    success,
    message,
    data,
  });
};


const handleServiceError = (error, res, next) => {
  if (error instanceof UserNotFoundError || 
      error instanceof InvalidCredentialsError || 
      error instanceof UnauthorizedError || 
      error instanceof ValidationError) {
    return handleResponse(res, error.statusCode, false, null, error.message);
  }
  next(error);
};

export const createUser = async (req, res, next) => {
  const { user_name, password, role_id, email, phone } = req.body;
  try {
    const newUser = await createUserService({ user_name, password, role_id, email, phone });
    handleResponse(res, 201, true, newUser, "User created successfully");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};



export const loginUser = async (req, res, next) => {
  const { user_name, password } = req.body;
  try {
    const authResult = await authenticateUserService(user_name, password);
    
    // Set cookie with standardized configuration
    res.cookie("token", authResult.token, getCookieConfig());

    handleResponse(res, 200, true, authResult, "Login successful");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out" });
};

// Get current user's profile
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await getUserByIdBusinessService(userId);
    handleResponse(res, 200, true, user, "Profile retrieved successfully");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};



export const getAllUsers = async (req, res, next) => {
  try {
    const users = await getAllUsersBusinessService();
    handleResponse(res, 200, true, users, "Users fetched successfully");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await getUserByIdBusinessService(req.params.id);
    handleResponse(res, 200, true, user, "User fetched successfully");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await deleteUserBusinessService(req.params.id);
    handleResponse(res, 200, true, deletedUser, "User deleted successfully");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};

// Update own credentials (requires current password)
export const updateOwnCredentials = async (req, res, next) => {
  try {
    const { current_password, ...updates } = req.body;
    const userId = req.user.userId; // From authentication middleware

    const result = await updateOwnCredentialsBusinessService(userId, current_password, updates);
    
    // Blacklist old token
    const oldToken = req.headers.authorization?.split(' ')[1];
    if (oldToken) {
      await addTokenToBlacklistService(oldToken, userId, 'user_update');
    }
    
    // Clear cookie and force re-login
    res.clearCookie("token");
    
    handleResponse(res, 200, true, { 
      user: result.user,
      requiresReLogin: true,
      message: "Credentials updated successfully. Please log in again."
    }, "Credentials updated successfully. Please log in again.");
  } catch (err) {
    handleServiceError(err, res, next);
  }
};

export const adminUpdateCredentials = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const updates = req.body;
    const currentUserId = req.user.userId; // Current admin's ID
    
    const result = await adminUpdateCredentialsBusinessService(targetUserId, updates, currentUserId);
    
    // If admin updated their own credentials, blacklist old token and force re-login
    if (targetUserId == currentUserId) {
      const oldToken = req.headers.authorization?.split(' ')[1];
      if (oldToken) {
        await addTokenToBlacklistService(oldToken, currentUserId, 'admin_self_update');
      }
      
      // Clear cookie and force re-login
      res.clearCookie("token");
      
      handleResponse(res, 200, true, { 
        user: result.user,
        requiresReLogin: true,
        message: "Your credentials were updated. Please log in again."
      }, "Your credentials were updated. Please log in again.");
    } else {
      // Admin updated another user, no re-login needed
      handleResponse(res, 200, true, result, "User credentials updated successfully by admin");
    }
  } catch (err) {
    handleServiceError(err, res, next);
  }
};

