import pkg from "pg";
import dotenv from "dotenv";
const { Pool } = pkg;
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// JWT configuration
export const jwtSecret = process.env.JWT_SECRET;
export const jwtExpiration = process.env.JWT_EXPIRATION || '24h';

// Auth config object
export const authConfig = {
  jwtSecret,
  jwtExpiration,
  tokenHeader: 'authorization'
};

pool.on("connect", () => {
  // Database connection pool established
});

export { pool };
export default pool;
