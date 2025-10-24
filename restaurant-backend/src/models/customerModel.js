import pool from "../config/db.js";

// Create customer
export const createCustomerService = async (customerData) => {
  const { 
    name, 
    phone_number, 
    email = null, 
    address = null, 
    date_of_birth = null,
    loyalty_points = 0,
    total_spent = 0.00
  } = customerData;

  const result = await pool.query(`
    INSERT INTO customers (
      phone_number, 
      name, 
      email, 
      address, 
      date_of_birth,
      loyalty_points,
      total_spent,
      created_at
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
    RETURNING *
  `, [phone_number, name, email, address, date_of_birth, loyalty_points, total_spent]);

  return result.rows[0];
};

// Find customer by phone number
export const findCustomerByPhoneService = async (phone_number) => {
  const result = await pool.query(`
    SELECT * FROM customers 
    WHERE phone_number = $1
  `, [phone_number]);

  return result.rows[0] || null;
};

// Get all customers (with pagination)
export const getAllCustomersService = async (page = 1, limit = 20, search = null) => {
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT * FROM customers
  `;
  
  const queryParams = [];
  
  if (search) {
    query += ` WHERE name ILIKE $1 OR phone_number ILIKE $1 OR email ILIKE $1`;
    queryParams.push(`%${search}%`);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
  queryParams.push(limit, offset);

  const result = await pool.query(query, queryParams);
  return result.rows;
};

export const getCustomerByIdService = async (customerId) => {
  const result = await pool.query(`
    SELECT * FROM customers WHERE customer_id = $1
  `, [customerId]);
  return result.rows[0] || null;
};// Update customer
export const updateCustomerService = async (customerId, updateData) => {
  const { name, phone_number, email, address, date_of_birth, loyalty_points, total_spent } = updateData;

  const result = await pool.query(`
    UPDATE customers 
    SET 
      name = COALESCE($1, name),
      phone_number = COALESCE($2, phone_number),
      email = COALESCE($3, email),
      address = COALESCE($4, address),
      date_of_birth = COALESCE($5, date_of_birth),
      loyalty_points = COALESCE($6, loyalty_points),
      total_spent = COALESCE($7, total_spent),
      updated_at = NOW()
    WHERE customer_id = $8
    RETURNING *
  `, [name, phone_number, email, address, date_of_birth, loyalty_points, total_spent, customerId]);

  return result.rows[0] || null;
};

// Delete customer
export const deleteCustomerService = async (customerId) => {
  // Check if customer has any reservations or orders
  const hasReservations = await pool.query(`
    SELECT COUNT(*) as count FROM reservations 
    WHERE customer_id = $1
  `, [customerId]);

  const hasOrders = await pool.query(`
    SELECT COUNT(*) as count FROM orders WHERE customer_id = $1
  `, [customerId]);

  if (parseInt(hasReservations.rows[0].count) > 0 || parseInt(hasOrders.rows[0].count) > 0) {
    throw new Error('Cannot delete customer with existing reservations or orders');
  }

  const result = await pool.query(`
    DELETE FROM customers WHERE customer_id = $1 RETURNING *
  `, [customerId]);
  
  return result.rows[0] || null;
};

// Get customer statistics
export const getCustomerStatsService = async () => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_customers,
      AVG(loyalty_points) as avg_loyalty_points,
      SUM(total_spent) as total_revenue,
      COUNT(*) FILTER (WHERE last_visit >= CURRENT_DATE - INTERVAL '30 days') as active_customers_30d
    FROM customers
  `);

  return result.rows[0];
};

// Search customers
export const searchCustomersService = async (searchTerm) => {
  const result = await pool.query(`
    SELECT 
      customer_id,
      name,
      phone_number,
      email,
      address,
      loyalty_points,
      total_spent,
      last_visit,
      created_at
    FROM customers 
    WHERE name ILIKE $1 OR phone_number ILIKE $1 OR email ILIKE $1
    ORDER BY 
      CASE WHEN name ILIKE $1 THEN 1 ELSE 2 END,
      created_at DESC
    LIMIT 10
  `, [`%${searchTerm}%`]);

  return result.rows;
};
