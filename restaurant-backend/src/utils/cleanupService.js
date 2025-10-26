import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Clean up orphaned files (files not referenced in database)
export const dailyFileCleanupService = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Get all active file references from database
    const activeFiles = await client.query(`
      SELECT DISTINCT image_url FROM (
        SELECT image_url FROM products WHERE image_url IS NOT NULL AND image_url != ''
        UNION
        SELECT image_url FROM menus WHERE image_url IS NOT NULL AND image_url != ''
        UNION
        SELECT image_url FROM categories WHERE image_url IS NOT NULL AND image_url != ''
        UNION
        SELECT image_url FROM subcategories WHERE image_url IS NOT NULL AND image_url != ''
      ) as all_images
      WHERE image_url LIKE '/uploads/%'
    `);
    
    // 2. Get all files in uploads directory
    const uploadDir = path.join(__dirname, '../../uploads');
    let files = [];
    
    try {
      files = fs.readdirSync(uploadDir);
    } catch (error) {
      return {
        success: true,
        deletedFiles: 0,
        files: [],
        message: 'No uploads directory found'
      };
    }
    
    // 3. Find orphaned files (not referenced in database)
    const activeFileNames = new Set();
    activeFiles.rows.forEach(row => {
      if (row.image_url) {
        const fileName = path.basename(row.image_url);
        activeFileNames.add(fileName);
        
        // Also add variant filenames (card, detail)
        const nameWithoutExt = path.basename(fileName, path.extname(fileName));
        const ext = path.extname(fileName);
        activeFileNames.add(`${nameWithoutExt}_card${ext}`);
        activeFileNames.add(`${nameWithoutExt}_detail${ext}`);
      }
    });
    
    const orphanedFiles = files.filter(file => {
      return !activeFileNames.has(file);
    });
    
    // 4. Delete orphaned files older than 24 hours
    const deletedFiles = [];
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    for (const file of orphanedFiles) {
      try {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = currentTime - stats.mtime.getTime();
        
        // Only delete files older than 24 hours
        if (fileAge > twentyFourHours) {
          fs.unlinkSync(filePath);
          deletedFiles.push(file);
        }
      } catch (error) {
        // File processing error - continue with next file
      }
    }
    
    await client.query('COMMIT');
    
    return {
      success: true,
      deletedFiles: deletedFiles.length,
      files: deletedFiles,
      totalOrphaned: orphanedFiles.length,
      message: `Successfully deleted ${deletedFiles.length} orphaned files (${orphanedFiles.length} total orphaned files found)`
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Clean up old orders and bills (older than 7 days)
export const weeklyCleanupService = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    
    // 1. Get count of old orders
    const oldOrdersCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE status IN ('completed', 'cancelled', 'closed') 
      AND order_date < NOW() - INTERVAL '7 days'
    `);
    
    // 2. Get count of old bills
    const oldBillsCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM bills 
      WHERE bill_date < NOW() - INTERVAL '7 days'
    `);
    
    
    // 3. Delete old order products and menus first (foreign key constraint)
    await client.query(`
      DELETE FROM order_products 
      WHERE order_id IN (
        SELECT order_id 
        FROM orders 
        WHERE status IN ('completed', 'cancelled', 'closed') 
        AND order_date < NOW() - INTERVAL '7 days'
      )
    `);
    
    await client.query(`
      DELETE FROM order_menus 
      WHERE order_id IN (
        SELECT order_id 
        FROM orders 
        WHERE status IN ('completed', 'cancelled', 'closed') 
        AND order_date < NOW() - INTERVAL '7 days'
      )
    `);
    
    // 4. Delete old bill products
    await client.query(`
      DELETE FROM bill_products 
      WHERE bill_id IN (
        SELECT bill_id 
        FROM bills 
        WHERE bill_date < NOW() - INTERVAL '7 days'
      )
    `);
    
    // 5. Delete old orders
    const deletedOrders = await client.query(`
      DELETE FROM orders 
      WHERE status IN ('completed', 'cancelled', 'closed') 
      AND order_date < NOW() - INTERVAL '7 days'
      RETURNING order_id
    `);
    
    // 6. Delete old bills
    const deletedBills = await client.query(`
      DELETE FROM bills 
      WHERE bill_date < NOW() - INTERVAL '7 days'
      RETURNING bill_id
    `);
    
    await client.query('COMMIT');
    
    
    return {
      success: true,
      deletedOrders: deletedOrders.rows.length,
      deletedBills: deletedBills.rows.length,
      message: `Successfully deleted ${deletedOrders.rows.length} old orders and ${deletedBills.rows.length} old bills`
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Clean up old reservations (older than 30 days)
export const monthlyCleanupService = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    
    // Get count of old reservations
    const oldReservationsCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM reservations 
      WHERE reservation_date < NOW() - INTERVAL '30 days'
    `);
    
    
    // Delete old reservations
    const deletedReservations = await client.query(`
      DELETE FROM reservations 
      WHERE reservation_date < NOW() - INTERVAL '30 days'
      RETURNING reservation_id
    `);
    
    await client.query('COMMIT');
    
    
    return {
      success: true,
      deletedReservations: deletedReservations.rows.length,
      message: `Successfully deleted ${deletedReservations.rows.length} old reservations`
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Manual cleanup with custom days
export const manualCleanupService = async (days = 7) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create interval string
    const intervalStr = `${days} days`;
    
    // 1. Get count of old orders
    const oldOrdersCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE status IN ('completed', 'cancelled', 'closed') 
      AND order_date < NOW() - INTERVAL $1
    `, [intervalStr]);
    
    // 2. Get count of old bills
    const oldBillsCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM bills 
      WHERE bill_date < NOW() - INTERVAL $1
    `, [intervalStr]);
    
    
    // 3. Delete old order products and menus first
    await client.query(`
      DELETE FROM order_products 
      WHERE order_id IN (
        SELECT order_id 
        FROM orders 
        WHERE status IN ('completed', 'cancelled', 'closed') 
        AND order_date < NOW() - INTERVAL $1
      )
    `, [intervalStr]);
    
    await client.query(`
      DELETE FROM order_menus 
      WHERE order_id IN (
        SELECT order_id 
        FROM orders 
        WHERE status IN ('completed', 'cancelled', 'closed') 
        AND order_date < NOW() - INTERVAL $1
      )
    `, [intervalStr]);
    
    // 4. Delete old bill products
    await client.query(`
      DELETE FROM bill_products 
      WHERE bill_id IN (
        SELECT bill_id 
        FROM bills 
        WHERE bill_date < NOW() - INTERVAL $1
      )
    `, [intervalStr]);
    
    // 5. Delete old orders
    const deletedOrders = await client.query(`
      DELETE FROM orders 
      WHERE status IN ('completed', 'cancelled', 'closed') 
      AND order_date < NOW() - INTERVAL $1
      RETURNING order_id
    `, [intervalStr]);
    
    // 6. Delete old bills
    const deletedBills = await client.query(`
      DELETE FROM bills 
      WHERE bill_date < NOW() - INTERVAL $1
      RETURNING bill_id
    `, [intervalStr]);
    
    await client.query('COMMIT');
    
    
    return {
      success: true,
      deletedOrders: deletedOrders.rows.length,
      deletedBills: deletedBills.rows.length,
      days: days,
      message: `Successfully deleted ${deletedOrders.rows.length} old orders and ${deletedBills.rows.length} old bills older than ${days} days`
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
