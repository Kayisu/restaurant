import pool from "../config/db.js";

// Validation functions
const validateTableId = (tableId) => {
  const tableIdRegex = /^[A-Z]-[0-9]{2}$/;
  return tableIdRegex.test(tableId);
};

const validateCapacity = (capacity) => {
  return Number.isInteger(capacity) && capacity > 0 && capacity <= 20;
};

// Check if table exists
export const tableExistsService = async (tableId) => {
  const result = await pool.query(
    'SELECT table_id FROM tables WHERE table_id = $1',
    [tableId]
  );
  return result.rows.length > 0;
};

// Get all tables
export const getAllTablesService = async () => {
  const result = await pool.query(`
    SELECT
      table_id,
      capacity,
      is_occupied,
      table_status,
      server_name,
      occupied_duration_formatted,
      reservation_date,
      reservation_time
    FROM dashboard_tables
    ORDER BY
      CASE
        WHEN EXISTS (
          SELECT 1 FROM reservations r
          WHERE r.table_id = dashboard_tables.table_id
          AND r.reservation_date = CURRENT_DATE
          AND r.status = 'confirmed'
        ) THEN 1
        WHEN is_occupied = false THEN 0
        ELSE 2
      END,
      table_id
  `);
  return result.rows;
};

export const getTableByIdService = async (tableId) => {
  const result = await pool.query(`
    SELECT * FROM table_details 
    WHERE table_id = $1
  `, [tableId]);
  return result.rows[0];
};

// Create new table
export const createTableService = async (tableData) => {
  const { table_id, capacity } = tableData;

  if (!validateTableId(table_id)) {
    throw new Error('Invalid table ID format. Must be in format: A-01, B-02, etc.');
  }

  // Validate capacity
  if (!validateCapacity(capacity)) {
    throw new Error('Invalid capacity. Must be a positive integer between 1 and 20.');
  }

  // Check if table already exists
  const exists = await tableExistsService(table_id);
  if (exists) {
    throw new Error(`Table ${table_id} already exists.`);
  }

  // Extract section code from table_id (e.g., "A-09" -> "A")
  const section_code = table_id.split('-')[0];
  
  // Create completely new table
  const result = await pool.query(`
    INSERT INTO tables (table_id, capacity, section_code, is_occupied, created_at)
    VALUES ($1, $2, $3, false, NOW())
    RETURNING *
  `, [table_id, capacity, section_code]);

  return result.rows[0];
};

// Delete table
export const deleteTableService = async (tableId) => {
  // Check if table exists
  const exists = await tableExistsService(tableId);
  if (!exists) {
    throw new Error(`Table ${tableId} not found.`);
  }

  // Check if table is currently occupied
  const tableResult = await pool.query(
    'SELECT is_occupied FROM tables WHERE table_id = $1',
    [tableId]
  );
  const table = tableResult.rows[0];

  if (table.is_occupied) {
    throw new Error(`Cannot delete table ${tableId}. Table is currently occupied.`);
  }

  // Check for active bills
  const billResult = await pool.query(
    'SELECT COUNT(*) as bill_count FROM bills WHERE order_id IN (SELECT order_id FROM orders WHERE table_id = $1) AND payment_status != \'completed\'',
    [tableId]
  );
  const billCount = parseInt(billResult.rows[0].bill_count);
  
  if (billCount > 0) {
    throw new Error(`Cannot delete table ${tableId}. Table has ${billCount} active bill(s). Please complete or cancel the bills first.`);
  }

  const sectionCode = tableId.split('-')[0]; // A, B, C, etc.
  const tableNumber = parseInt(tableId.split('-')[1]); // 01, 02, 03, etc.
  
  const lastTableResult = await pool.query(
    'SELECT table_id FROM tables WHERE table_id LIKE $1 ORDER BY table_id DESC LIMIT 1',
    [`${sectionCode}-%`]
  );
  
  if (lastTableResult.rows.length > 0) {
    const lastTableId = lastTableResult.rows[0].table_id;
    const lastTableNumber = parseInt(lastTableId.split('-')[1]);
    
    if (tableNumber !== lastTableNumber) {
      throw new Error(`Cannot delete table ${tableId}. Only the last table in section ${sectionCode} can be deleted.`);
    }
  }

  // Delete all related data
  try {
    // Delete all orders related to this table
    await pool.query('DELETE FROM order_products WHERE order_id IN (SELECT order_id FROM orders WHERE table_id = $1)', [tableId]);
    await pool.query('DELETE FROM orders WHERE table_id = $1', [tableId]);
    
    // Delete all bills related to this table (via orders)
    await pool.query('DELETE FROM bill_products WHERE bill_id IN (SELECT bill_id FROM bills WHERE order_id IN (SELECT order_id FROM orders WHERE table_id = $1))', [tableId]);
    await pool.query('DELETE FROM bills WHERE order_id IN (SELECT order_id FROM orders WHERE table_id = $1)', [tableId]);
    
    // Delete all reservations related to this table
    await pool.query('DELETE FROM reservations WHERE table_id = $1', [tableId]);
  } catch (error) {
    throw error;
  }

  const result = await pool.query(
    'DELETE FROM tables WHERE table_id = $1 RETURNING *',
    [tableId]
  );

  return result.rows[0];
};

// Update table status
export const updateTableStatusService = async (tableId, statusData) => {
  const { is_occupied } = statusData;

  // Check if table exists
  const exists = await tableExistsService(tableId);
  if (!exists) {
    throw new Error(`Table ${tableId} not found.`);
  }

  const updateQuery = `
    UPDATE tables 
    SET 
      is_occupied = $1,
      occupied_since = CASE 
        WHEN $1 = true AND is_occupied = false THEN CURRENT_TIMESTAMP
        WHEN $1 = false THEN NULL
        ELSE occupied_since
      END,
      current_customer_id = CASE 
        WHEN $1 = false THEN NULL
        ELSE current_customer_id
      END,
      assigned_server = CASE 
        WHEN $1 = false THEN NULL
        ELSE assigned_server
      END
    WHERE table_id = $2
    RETURNING *
  `;

  const result = await pool.query(updateQuery, [is_occupied, tableId]);
  return result.rows[0];
};

// Clear table customer data (make table available)
export const clearTableCustomerService = async (tableId) => {
  // Check if table exists
  const exists = await tableExistsService(tableId);
  if (!exists) {
    throw new Error(`Table ${tableId} not found.`);
  }

  const result = await pool.query(`
    UPDATE tables 
    SET 
      is_occupied = false,
      current_customer_id = NULL,
      occupied_since = NULL,
      assigned_server = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE table_id = $1
    RETURNING *
  `, [tableId]);

  return result.rows[0];
};

// Update table reservation status - DEPRECATED: Use reservation system instead
export const updateTableReservationService = async (tableId, reservationData) => {
  // Check if table exists
  const exists = await tableExistsService(tableId);
  if (!exists) {
    throw new Error(`Table ${tableId} not found.`);
  }

  // This function is deprecated - reservations are now handled by the reservation system
  return { message: 'Reservation status updates are now handled by the reservation system' };
};

// Update table properties (capacity)
export const updateTableService = async (tableId, updateData) => {
  const { capacity } = updateData;

  // Check if table exists
  const exists = await tableExistsService(tableId);
  if (!exists) {
    throw new Error(`Table ${tableId} not found.`);
  }

  // Validate capacity if provided
  if (capacity !== undefined && !validateCapacity(capacity)) {
    throw new Error('Invalid capacity. Must be a positive integer between 1 and 20.');
  }

  // Build dynamic update query
  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  if (capacity !== undefined) {
    updateFields.push(`capacity = $${paramIndex}`);
    updateValues.push(capacity);
    paramIndex++;
  }

  // Add updated_at timestamp
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

  // Add table_id for WHERE clause
  updateValues.push(tableId);

  const updateQuery = `
    UPDATE tables 
    SET ${updateFields.join(', ')}
    WHERE table_id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, updateValues);
  return result.rows[0];
};

// Get dashboard stats
export const getDashboardStatsService = async () => {
  const result = await pool.query('SELECT * FROM dashboard_stats');
  
  // Convert string numbers to actual numbers
  const stats = result.rows[0];
  return {
    ...stats,
    total_tables: parseInt(stats.total_tables),
    occupied_tables: parseInt(stats.occupied_tables),
    reserved_tables: parseInt(stats.reserved_tables),
    available_tables: parseInt(stats.available_tables),
    ordering_tables: parseInt(stats.ordering_tables),
    preparing_tables: parseInt(stats.preparing_tables),
    ready_tables: parseInt(stats.ready_tables),
    served_tables: parseInt(stats.served_tables),
    avg_occupation_time: parseInt(stats.avg_occupation_time),
    active_orders_total: parseFloat(stats.active_orders_total)
  };
};

// Get table sections
export const getTableSectionsService = async () => {
  const result = await pool.query('SELECT * FROM table_sections ORDER BY section_code');
  
  // Convert string numbers to actual numbers
  return result.rows.map(row => ({
    ...row,
    total_tables: parseInt(row.total_tables),
    occupied_tables: parseInt(row.occupied_tables),
    reserved_tables: parseInt(row.reserved_tables),
    available_tables: parseInt(row.available_tables),
    total_capacity: parseInt(row.total_capacity),
    available_capacity: parseInt(row.available_capacity),
    occupancy_rate: parseFloat(row.occupancy_rate),
    avg_capacity: parseFloat(row.avg_capacity),
    avg_occupied_time: row.avg_occupied_time ? parseFloat(row.avg_occupied_time) : null,
    tables_with_orders: parseInt(row.tables_with_orders),
    section_revenue: parseFloat(row.section_revenue)
  }));
};

// Get section summary
export const getSectionSummaryService = async () => {
  const result = await pool.query('SELECT * FROM dashboard_section_summary');
  return result.rows;
};

// Get tables by section
export const getSectionTablesService = async (sectionCode) => {
  const result = await pool.query(`
    SELECT 
      LEFT(table_id, 1) as section_code,
      LEFT(table_id, 1) as section_name,
      table_id,
      capacity,
      is_occupied,
      table_status,
      server_name,
      occupied_duration_formatted,


      reservation_id,
      reserved_party_size,
      reservation_date,
      reservation_time,
      reservation_status,

      RIGHT(table_id, LENGTH(table_id) - 2)::INTEGER as table_number
    FROM dashboard_tables 
    WHERE LEFT(table_id, 1) = $1 
    ORDER BY RIGHT(table_id, LENGTH(table_id) - 2)::INTEGER
  `, [sectionCode.toUpperCase()]);
  return result.rows;
};


