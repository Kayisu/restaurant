import { pool } from "../config/db.js";
import crypto from 'crypto';

/**
 * Token Blacklist Model
 * Manages blacklisted JWT tokens to invalidate them before expiration
 */

// Hash token for storage (don't store actual JWT)
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Add token to blacklist
export const addTokenToBlacklistService = async (token, userId, reason = 'user_update') => {
  try {
    const tokenHash = hashToken(token);
    
    // Decode token to get expiration
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);
    
    const query = `
      INSERT INTO token_blacklist (token_hash, user_id, expires_at, reason)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (token_hash) DO NOTHING
    `;
    
    await pool.query(query, [tokenHash, userId, expiresAt, reason]);
    
  } catch (error) {
    throw error;
  }
};

// Check if token is blacklisted
export const isTokenBlacklistedService = async (token) => {
  try {
    const tokenHash = hashToken(token);
    
    const query = `
      SELECT id FROM token_blacklist 
      WHERE token_hash = $1 AND expires_at > NOW()
    `;
    
    const result = await pool.query(query, [tokenHash]);
    return result.rows.length > 0;
    
  } catch (error) {
    return false; // If error, allow token (fail open)
  }
};

// Cleanup expired tokens
export const cleanupExpiredTokensService = async () => {
  try {
    const query = `DELETE FROM token_blacklist WHERE expires_at < NOW()`;
    const result = await pool.query(query);
    return result.rowCount;
  } catch (error) {
    throw error;
  }
};

// Get blacklisted tokens for user
export const getUserBlacklistedTokensService = async (userId) => {
  try {
    const query = `
      SELECT id, created_at, expires_at, reason 
      FROM token_blacklist 
      WHERE user_id = $1 AND expires_at > NOW()
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    throw error;
  }
};


