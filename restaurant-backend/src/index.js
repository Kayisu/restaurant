import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { validateEnvironmentVariables, getEnvWithDefaults } from './config/envValidation.js';
import pool from './config/db.js';
import pg from 'pg';
import userRoutes from './routes/userRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import billRoutes from './routes/billRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import cleanupRoutes from './routes/cleanupRoutes.js';
import errorHandling from './middlewares/errorHandler.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import './utils/scheduler.js'; 

dotenv.config();

// Validate environment variables on startup
validateEnvironmentVariables();

// Override PostgreSQL date/time parsing to return strings instead of Date objects
// This prevents timezone conversion issues
const types = pg.types;

// DATE type 
types.setTypeParser(1082, function(val) {
  return val; // Return the raw string as-is
});

// TIME WITHOUT TIME ZONE type 
types.setTypeParser(1083, function(val) {
  return val; // Return the raw string as-is
});

// TIMESTAMP WITHOUT TIME ZONE type 
types.setTypeParser(1114, function(val) {
  return val; // Return the raw string as-is
});

// TIMESTAMP WITH TIME ZONE type 
types.setTypeParser(1184, function(val) {
  return val; // Return the raw string as-is
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Get environment variables with defaults
const env = getEnvWithDefaults();
const port = env.PORT;

const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With']
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/users', userRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cleanup', cleanupRoutes);

app.use(errorHandling);

// Health check endpoint
app.get("/", (req, res) => {
    res.json({ 
        message: "Restaurant API is running", 
        version: "1.0.0",
        status: "healthy"
    });
});

app.listen(port, () => {
  // Server started successfully
});

