import jwt from "jsonwebtoken";
import { jwtSecret, jwtExpiration } from "../config/db.js";
import cookieParser from 'cookie-parser';
import { isTokenBlacklistedService } from "../models/tokenBlacklistModel.js";

export const generateToken = (payload) => {
  return jwt.sign(payload, jwtSecret, { 
    expiresIn: jwtExpiration 
  });
};

export const verifyToken = async (req, res, next) => {
  let token = req.cookies.token;
  const authHeader = req.headers.authorization; 

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ 
      status: 401, 
      message: "Access token is required" 
    });
  }

  try {
    const isBlacklisted = await isTokenBlacklistedService(token);
    if (isBlacklisted) {
      return res.status(403).json({ 
        status: 403, 
        message: "Token has been invalidated" 
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = {
      user_id: decoded.userId,
      userId: decoded.userId, 
      user_name: decoded.user_name,
      role_id: decoded.role_id
    };
    next();
  } catch (err) {
    return res.status(403).json({ 
      status: 403, 
      message: "Invalid or expired token" 
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role_id !== 1) {
    return res.status(403).json({
      status: 403,
      message: "Admin access required."
    });
  }
  next();
};

export const requireStaff = (req, res, next) => {
  if (req.user.role_id !== 1 && req.user.role_id !== 2) {
    return res.status(403).json({
      status: 403,
      message: "Staff access required."
    });
  }
  next();
};

