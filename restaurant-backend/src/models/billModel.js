import pool from "../config/db.js";
import {
  calculateTax,
  calculateServiceCharge,
  calculateTotal,
} from "../config/taxConfig.js";

// Get all bills
export const getAllBillsService = async () => {
  const result = await pool.query(`
    SELECT 
      b.*,
      COALESCE(c.name, oc.name) as customer_name,
      COALESCE(c.phone_number, oc.phone_number) as customer_phone,
      u.user_name as server_name,
      u2.user_name as issued_by_name,
      o.table_id,
      o.status as order_status
    FROM bills b
    LEFT JOIN customers c ON b.customer_id = c.customer_id
    LEFT JOIN users u ON b.server_id = u.user_id
    LEFT JOIN users u2 ON b.issued_by = u2.user_id
    LEFT JOIN orders o ON b.order_id = o.order_id
    LEFT JOIN customers oc ON o.customer_id = oc.customer_id
    ORDER BY b.bill_date DESC
  `);
  return result.rows;
};

// Get bill by ID
export const getBillByIdService = async (billId) => {
  const result = await pool.query(
    `
    SELECT 
      b.*,
      COALESCE(c.name, oc.name) as customer_name,
      COALESCE(c.phone_number, oc.phone_number) as customer_phone,
      u.user_name as server_name,
      u2.user_name as issued_by_name,
      o.table_id,
      o.status as order_status
    FROM bills b
    LEFT JOIN customers c ON b.customer_id = c.customer_id
    LEFT JOIN users u ON b.server_id = u.user_id
    LEFT JOIN users u2 ON b.issued_by = u2.user_id
    LEFT JOIN orders o ON b.order_id = o.order_id
    LEFT JOIN customers oc ON o.customer_id = oc.customer_id
    WHERE b.bill_id = $1
  `,
    [billId]
  );
  return result.rows[0];
};

// Get bill products (both menu items and individual products)
export const getBillProductsService = async (billId) => {
  const result = await pool.query(
    `
    SELECT 
      bp.*,
      CASE 
        WHEN bp.is_menu_item = true THEN m.menu_name
        ELSE p.name 
      END as product_name,
      CASE 
        WHEN bp.is_menu_item = true THEN m.description
        ELSE p.description 
      END as description,
      CASE 
        WHEN bp.is_menu_item = true THEN m.image_url
        ELSE p.image_url 
      END as image_url,
      bp.is_menu_item,
      m.menu_id,
      p.product_id
    FROM bill_products bp
    LEFT JOIN menus m ON bp.menu_id = m.menu_id AND bp.is_menu_item = true
    LEFT JOIN products p ON bp.product_id = p.product_id AND bp.is_menu_item = false
    WHERE bp.bill_id = $1
    ORDER BY bp.created_at
  `,
    [billId]
  );
  return result.rows;
};

// Create bill
export const createBillService = async (billData) => {
  const {
    order_id,
    customer_id,
    bill_number,
    subtotal,
    tax_amount,
    discount_amount = 0.0,
    service_charge,
    total_amount,
    payment_status = "pending",
    due_date,
    server_id,
    issued_by,
  } = billData;

  // Calculate tax and service charge if not provided
  const calculatedTax =
    tax_amount !== undefined ? tax_amount : calculateTax(calculatedSubtotal);
  const calculatedServiceCharge =
    service_charge !== undefined
      ? service_charge
      : calculateServiceCharge(calculatedSubtotal);
  const calculatedTotal =
    total_amount !== undefined
      ? total_amount
      : calculateTotal(
          calculatedSubtotal,
          calculatedTax,
          calculatedServiceCharge,
          discount_amount
        );

  // Validate required fields
  if (!bill_number) {
    throw new Error("Bill number is required.");
  }
  
  // If subtotal is not provided, calculate it from order products
  let calculatedSubtotal = subtotal;
  if (!calculatedSubtotal && order_id) {
    const subtotalResult = await pool.query(
      `
      SELECT COALESCE(SUM(total_price), 0) as subtotal
      FROM (
        SELECT total_price FROM order_products WHERE order_id = $1
        UNION ALL
        SELECT total_price FROM order_menus WHERE order_id = $1
      ) combined_items
      `,
      [order_id]
    );
    calculatedSubtotal = parseFloat(subtotalResult.rows[0].subtotal);
  }
  
  if (!calculatedSubtotal) {
    throw new Error("Subtotal is required or order_id must be provided to calculate subtotal.");
  }

  // Check if bill number already exists
  const existingBill = await pool.query(
    "SELECT bill_id FROM bills WHERE bill_number = $1",
    [bill_number]
  );
  if (existingBill.rows.length > 0) {
    throw new Error(`Bill number ${bill_number} already exists.`);
  }

  // Validate order_id if provided
  if (order_id) {
    const orderExists = await pool.query(
      "SELECT order_id FROM orders WHERE order_id = $1",
      [order_id]
    );
    if (orderExists.rows.length === 0) {
      throw new Error(`Order ${order_id} not found.`);
    }
  }

  // Validate customer_id if provided
  if (customer_id) {
    const customerExists = await pool.query(
      "SELECT customer_id FROM customers WHERE customer_id = $1",
      [customer_id]
    );
    if (customerExists.rows.length === 0) {
      throw new Error(`Customer ${customer_id} not found.`);
    }
  }

  // Validate server_id if provided
  if (server_id) {
    const serverExists = await pool.query(
      "SELECT user_id FROM users WHERE user_id = $1",
      [server_id]
    );
    if (serverExists.rows.length === 0) {
      throw new Error(`Server ${server_id} not found.`);
    }
  }

  // Validate issued_by if provided
  if (issued_by) {
    const userExists = await pool.query(
      "SELECT user_id FROM users WHERE user_id = $1",
      [issued_by]
    );
    if (userExists.rows.length === 0) {
      throw new Error(`User ${issued_by} not found.`);
    }
  }

  const result = await pool.query(
    `
    INSERT INTO bills (
      order_id, customer_id, bill_number, subtotal, tax_amount, 
      discount_amount, service_charge, total_amount, payment_status, 
      due_date, server_id, issued_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `,
    [
      order_id,
      customer_id,
      bill_number,
      calculatedSubtotal,
      calculatedTax,
      discount_amount,
      calculatedServiceCharge,
      calculatedTotal,
      payment_status,
      due_date,
      server_id,
      issued_by,
    ]
  );

  const bill = result.rows[0];

  // If order_id is provided, copy products and menus from order to bill
  if (order_id) {
    // Copy order products to bill products
    const orderProducts = await pool.query(
      `
      SELECT product_id, quantity, unit_price, total_price
      FROM order_products 
      WHERE order_id = $1
    `,
      [order_id]
    );

    for (const product of orderProducts.rows) {
      await pool.query(
        `
        INSERT INTO bill_products (
          bill_id, product_id, quantity, unit_price, total_price, discount_amount, is_menu_item
        ) VALUES ($1, $2, $3, $4, $5, $6, false)
      `,
        [
          bill.bill_id,
          product.product_id,
          product.quantity,
          product.unit_price,
          product.total_price,
          0.0,
        ]
      );
    }

    // Copy order menus to bill products (with is_menu_item = true)
    const orderMenus = await pool.query(
      `
      SELECT menu_id, quantity, unit_price, total_price
      FROM order_menus 
      WHERE order_id = $1
    `,
      [order_id]
    );

    for (const menu of orderMenus.rows) {
      await pool.query(
        `
        INSERT INTO bill_products (
          bill_id, menu_id, quantity, unit_price, total_price, discount_amount, is_menu_item
        ) VALUES ($1, $2, $3, $4, $5, $6, true)
      `,
        [
          bill.bill_id,
          menu.menu_id,
          menu.quantity,
          menu.unit_price,
          menu.total_price,
          0.0,
        ]
      );
    }
  }

  return bill;
};

// Update bill
export const updateBillService = async (billId, updateData) => {
  const {
    subtotal,
    tax_amount,
    discount_amount,
    service_charge,
    total_amount,
    payment_status,
    due_date,
  } = updateData;

  // Check if bill exists
  const billExists = await pool.query(
    "SELECT bill_id FROM bills WHERE bill_id = $1",
    [billId]
  );
  if (billExists.rows.length === 0) {
    throw new Error(`Bill ${billId} not found.`);
  }

  // Calculate subtotal from bill products if not provided
  let calculatedSubtotal = subtotal;
  if (calculatedSubtotal === undefined) {
    const subtotalResult = await pool.query(
      `
      SELECT COALESCE(SUM(total_price), 0) as subtotal
      FROM bill_products 
      WHERE bill_id = $1
      `,
      [billId]
    );
    calculatedSubtotal = parseFloat(subtotalResult.rows[0].subtotal);
  }

  // Build dynamic update query
  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  if (calculatedSubtotal !== undefined) {
    updateFields.push(`subtotal = $${paramIndex}`);
    updateValues.push(calculatedSubtotal);
    paramIndex++;
  }

  // Calculate tax and service charge if not provided
  const calculatedTax = tax_amount !== undefined ? tax_amount : calculateTax(calculatedSubtotal);
  const calculatedServiceCharge = service_charge !== undefined ? service_charge : calculateServiceCharge(calculatedSubtotal);
  const calculatedTotal = total_amount !== undefined ? total_amount : calculateTotal(calculatedSubtotal, calculatedTax, calculatedServiceCharge, discount_amount || 0);

  if (calculatedTax !== undefined) {
    updateFields.push(`tax_amount = $${paramIndex}`);
    updateValues.push(calculatedTax);
    paramIndex++;
  }

  if (discount_amount !== undefined) {
    updateFields.push(`discount_amount = $${paramIndex}`);
    updateValues.push(discount_amount);
    paramIndex++;
  }

  if (calculatedServiceCharge !== undefined) {
    updateFields.push(`service_charge = $${paramIndex}`);
    updateValues.push(calculatedServiceCharge);
    paramIndex++;
  }

  if (calculatedTotal !== undefined) {
    updateFields.push(`total_amount = $${paramIndex}`);
    updateValues.push(calculatedTotal);
    paramIndex++;
  }

  if (payment_status !== undefined) {
    updateFields.push(`payment_status = $${paramIndex}`);
    updateValues.push(payment_status);
    paramIndex++;
  }

  if (due_date !== undefined) {
    updateFields.push(`due_date = $${paramIndex}`);
    updateValues.push(due_date);
    paramIndex++;
  }

  if (updateFields.length === 0) {
    throw new Error("No fields to update.");
  }

  // Add updated_at timestamp
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

  // Add bill_id for WHERE clause
  updateValues.push(billId);

  const updateQuery = `
    UPDATE bills 
    SET ${updateFields.join(", ")}
    WHERE bill_id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, updateValues);
  return result.rows[0];
};

// Delete bill
export const deleteBillService = async (billId) => {
  // Check if bill exists
  const billExists = await pool.query(
    "SELECT bill_id FROM bills WHERE bill_id = $1",
    
    [billId]
  );
  if (billExists.rows.length === 0) {
    throw new Error(`Bill ${billId} not found.`);
  }

  // Hard delete - delete bill products first, then bill

  // Delete bill products first
  const deleteProductsResult = await pool.query(
    "DELETE FROM bill_products WHERE bill_id = $1",
    [billId]
  );

  const result = await pool.query(
    "DELETE FROM bills WHERE bill_id = $1 RETURNING *",
    [billId]
  );

  return result.rows[0];
};

// Add product to bill
export const addBillProductService = async (billId, productData) => {
  const {
    product_id,
    quantity = 1,
    unit_price,
    total_price,
    discount_amount = 0.0,
  } = productData;

  // Validate required fields
  if (!product_id || !unit_price || !total_price) {
    throw new Error("Product ID, unit price, and total price are required.");
  }

  // Check if bill exists
  const billExists = await pool.query(
    "SELECT bill_id FROM bills WHERE bill_id = $1",
    [billId]
  );
  if (billExists.rows.length === 0) {
    throw new Error(`Bill ${billId} not found.`);
  }

  // Check if product exists
  const productExists = await pool.query(
    "SELECT product_id FROM products WHERE product_id = $1",
    [product_id]
  );
  if (productExists.rows.length === 0) {
    throw new Error(`Product ${product_id} not found.`);
  }

  // Check if product already exists in bill
  const existingProduct = await pool.query(
    "SELECT bill_product_id, quantity FROM bill_products WHERE bill_id = $1 AND product_id = $2",
    [billId, product_id]
  );
  
  if (existingProduct.rows.length > 0) {
    // Product already exists, update quantity instead of creating new entry
    const currentQuantity = existingProduct.rows[0].quantity;
    const newQuantity = currentQuantity + quantity;
    const newTotalPrice = unit_price * newQuantity;
    
    const result = await pool.query(
      `
      UPDATE bill_products 
      SET quantity = $1, total_price = $2
      WHERE bill_id = $3 AND product_id = $4
      RETURNING *
    `,
      [newQuantity, newTotalPrice, billId, product_id]
    );
    
    return result.rows[0];
  } else {
    // Product doesn't exist, create new entry
    const result = await pool.query(
      `
      INSERT INTO bill_products (
        bill_id, product_id, quantity, unit_price, total_price, discount_amount
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [billId, product_id, quantity, unit_price, total_price, discount_amount]
    );
    
    return result.rows[0];
  }
};

// Add menu item to bill
export const addBillMenuService = async (billId, menuData) => {
  const {
    menu_id,
    quantity = 1,
    unit_price,
    total_price,
    discount_amount = 0.0,
  } = menuData;

  // Convert menu_id to integer if it's a string
  const menuIdInt = parseInt(menu_id);
  if (isNaN(menuIdInt)) {
    throw new Error("Invalid menu ID format.");
  }

  // Validate required fields
  if (!menu_id) {
    throw new Error("Menu ID is required.");
  }
  if (!unit_price) {
    throw new Error("Unit price is required.");
  }
  if (!total_price) {
    throw new Error("Total price is required.");
  }
  if (unit_price <= 0) {
    throw new Error("Unit price must be greater than 0.");
  }
  if (total_price <= 0) {
    throw new Error("Total price must be greater than 0.");
  }
  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0.");
  }

  // Check if bill exists
  const billExists = await pool.query(
    "SELECT bill_id FROM bills WHERE bill_id = $1",
    [billId]
  );
  if (billExists.rows.length === 0) {
    throw new Error(`Bill ${billId} not found.`);
  }

  // Check if menu exists
  const menuExists = await pool.query(
    "SELECT menu_id FROM menus WHERE menu_id = $1",
    [menuIdInt]
  );
  if (menuExists.rows.length === 0) {
    throw new Error(`Menu ${menuIdInt} not found.`);
  }

  // Check if menu already exists in bill
  const existingMenu = await pool.query(
    "SELECT bill_product_id, quantity FROM bill_products WHERE bill_id = $1 AND menu_id = $2",
    [billId, menuIdInt]
  );
  
  if (existingMenu.rows.length > 0) {
    // Menu already exists, update quantity instead of creating new entry
    const currentQuantity = existingMenu.rows[0].quantity;
    const newQuantity = currentQuantity + quantity;
    const newTotalPrice = unit_price * newQuantity;
    
    const result = await pool.query(
      `
      UPDATE bill_products 
      SET quantity = $1, total_price = $2
      WHERE bill_id = $3 AND menu_id = $4
      RETURNING *
    `,
      [newQuantity, newTotalPrice, billId, menuIdInt]
    );
    
    return result.rows[0];
  } else {
    // Menu doesn't exist, create new entry
    const result = await pool.query(
      `
      INSERT INTO bill_products (
        bill_id, menu_id, quantity, unit_price, total_price, discount_amount, is_menu_item
      ) VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING *
    `,
      [billId, menuIdInt, quantity, unit_price, total_price, discount_amount]
    );
    
    return result.rows[0];
  }
};

// Update bill product
export const updateBillProductService = async (billProductId, updateData) => {
  const { quantity, unit_price, total_price, discount_amount } = updateData;

  // Check if bill product exists
  const billProductExists = await pool.query(
    "SELECT bill_product_id FROM bill_products WHERE bill_product_id = $1",
    [billProductId]
  );
  if (billProductExists.rows.length === 0) {
    throw new Error(`Bill product ${billProductId} not found.`);
  }

  // Build dynamic update query
  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  if (quantity !== undefined) {
    updateFields.push(`quantity = $${paramIndex}`);
    updateValues.push(quantity);
    paramIndex++;
  }

  if (unit_price !== undefined) {
    updateFields.push(`unit_price = $${paramIndex}`);
    updateValues.push(unit_price);
    paramIndex++;
  }

  if (total_price !== undefined) {
    updateFields.push(`total_price = $${paramIndex}`);
    updateValues.push(total_price);
    paramIndex++;
  }

  if (discount_amount !== undefined) {
    updateFields.push(`discount_amount = $${paramIndex}`);
    updateValues.push(discount_amount);
    paramIndex++;
  }

  if (updateFields.length === 0) {
    throw new Error("No fields to update.");
  }

  // Add bill_product_id for WHERE clause
  updateValues.push(billProductId);

  const updateQuery = `
    UPDATE bill_products 
    SET ${updateFields.join(", ")}
    WHERE bill_product_id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, updateValues);
  return result.rows[0];
};

// Remove product from bill
export const removeBillProductService = async (billProductId) => {
  // Check if bill product exists
  const billProductExists = await pool.query(
    "SELECT bill_product_id FROM bill_products WHERE bill_product_id = $1",
    [billProductId]
  );
  if (billProductExists.rows.length === 0) {
    throw new Error(`Bill product ${billProductId} not found.`);
  }

  const result = await pool.query(
    "DELETE FROM bill_products WHERE bill_product_id = $1 RETURNING *",
    [billProductId]
  );

  return result.rows[0];
};

// Get bills by customer
export const getBillsByCustomerService = async (customerId) => {
  const result = await pool.query(
    `
    SELECT 
      b.*,
      c.name as customer_name,
      c.phone_number as customer_phone,
      u.user_name as server_name,
      u2.user_name as issued_by_name,
      o.table_id,
      o.status as order_status
    FROM bills b
    LEFT JOIN customers c ON b.customer_id = c.customer_id
    LEFT JOIN users u ON b.server_id = u.user_id
    LEFT JOIN users u2 ON b.issued_by = u2.user_id
    LEFT JOIN orders o ON b.order_id = o.order_id
    WHERE b.customer_id = $1
    ORDER BY b.bill_date DESC
  `,
    [customerId]
  );
  return result.rows;
};

// Get bills by order
export const getBillsByOrderService = async (orderId) => {
  const result = await pool.query(
    `
    SELECT 
      b.*,
      c.name as customer_name,
      c.phone_number as customer_phone,
      u.user_name as server_name,
      u2.user_name as issued_by_name,
      o.table_id,
      o.status as order_status
    FROM bills b
    LEFT JOIN customers c ON b.customer_id = c.customer_id
    LEFT JOIN users u ON b.server_id = u.user_id
    LEFT JOIN users u2 ON b.issued_by = u2.user_id
    LEFT JOIN orders o ON b.order_id = o.order_id
    WHERE b.order_id = $1
    ORDER BY b.bill_date DESC
  `,
    [orderId]
  );
  return result.rows;
};

// Generate unique bill number
export const generateBillNumberService = async () => {
  const result = await pool.query(`
    SELECT COALESCE(MAX(CAST(SUBSTRING(bill_number FROM '\\d+') AS INTEGER)), 0) + 1 as next_number
    FROM bills 
    WHERE bill_number ~ '^\\d+$'
  `);
  const nextNumber = result.rows[0].next_number;
  return nextNumber.toString().padStart(6, "0");
};

// Update bill status
export const updateBillStatusService = async (billId, status) => {
  // Validate status
  const validStatuses = ["pending", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new Error(
      `Invalid bill status. Must be one of: ${validStatuses.join(", ")}`
    );
  }

  // Check if bill exists
  const billExists = await pool.query(
    "SELECT bill_id FROM bills WHERE bill_id = $1",
    [billId]
  );
  if (billExists.rows.length === 0) {
    throw new Error(`Bill ${billId} not found.`);
  }

  const result = await pool.query(
    `
    UPDATE bills 
    SET bill_status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE bill_id = $2
    RETURNING *
  `,
    [status, billId]
  );

  return result.rows[0];
};

// Complete bill
export const completeBillService = async (billId) => {
  return await updateBillStatusService(billId, "completed");
};

// Cancel bill
export const cancelBillService = async (billId) => {
  return await updateBillStatusService(billId, "cancelled");
};
