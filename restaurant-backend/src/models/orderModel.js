import pool from "../config/db.js";
import {
  calculateTax,
  calculateServiceCharge,
  calculateTotal,
} from "../config/taxConfig.js";

// Generate bill number
const generateBillNumber = async (client) => {
  const result = await client.query(`
    SELECT COALESCE(MAX(CAST(SUBSTRING(bill_number FROM 2) AS INTEGER)), 0) + 1 as next_number
    FROM bills
  `);
  const nextNumber = result.rows[0].next_number;
  return `B${nextNumber.toString().padStart(6, "0")}`;
};

// Basic Order Operations

export const getAllOrdersService = async () => {
  const result = await pool.query(`
    SELECT * FROM order_summary_view
    ORDER BY order_date DESC
  `);
  return result.rows;
};

export const createOrderService = async (
  table_id,
  customer_id = null,
  server_id = null
) => {
  const result = await pool.query(
    `
    INSERT INTO orders (table_id, customer_id, server_id, status)
    VALUES ($1, $2, $3, 'pending')
    RETURNING *
  `,
    [table_id, customer_id, server_id]
  );

  const order = result.rows[0];

  return order;
};

export const createOrderAfterSeatingService = async (
  table_id,
  customer_id = null,
  server_id = null
) => {
  // Check if table is occupied
  const tableCheck = await pool.query(
    `
    SELECT is_occupied FROM tables WHERE table_id = $1::VARCHAR
  `,
    [table_id]
  );

  if (tableCheck.rows.length === 0) {
    throw new Error("Table not found");
  }

  if (!tableCheck.rows[0].is_occupied) {
    throw new Error("Customer has not been seated yet. Please seat the customer first.");
  }

  // Use the provided customer_id parameter (not the table's current_customer_id)

  // Create order with the provided customer_id
  const result = await pool.query(
    `
    INSERT INTO orders (table_id, customer_id, server_id, status)
    VALUES ($1::VARCHAR, $2, $3, 'pending')
    RETURNING *
  `,
    [table_id, customer_id, server_id]
  );

  const order = result.rows[0];

  return order;
};

// Add product to order from catalog
export const addProductToOrderService = async (
  order_id,
  product_id,
  quantity = 1
) => {
  try {
    // Get product price
    const productResult = await pool.query(
      `
      SELECT price FROM products WHERE product_id = $1 AND is_available = true
    `,
      [product_id]
    );

    if (productResult.rows.length === 0) {
      throw new Error("Product not found or not available");
    }

    const unit_price = productResult.rows[0].price;
    const calculated_total_price = unit_price * quantity;

    // Add to order_products table
    const result = await pool.query(
      `
      INSERT INTO order_products (order_id, product_id, quantity, unit_price, total_price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [
        order_id,
        product_id,
        quantity,
        unit_price,
        calculated_total_price
      ]
    );

    // Update order totals

    await updateOrderTotals(order_id);

    // Get updated order details to show current items
    const orderDetails = await getOrderByIdService(order_id);
    if (orderDetails) {
      // Count products and menus from items array
      const products =
        orderDetails.items?.filter((item) => item.item_type === "product") ||
        [];
      const menus =
        orderDetails.items?.filter((item) => item.item_type === "menu") || [];
    }
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Add menu to order
export const addMenuToOrderService = async (
  order_id,
  menu_id,
  quantity = 1
) => {
  try {
    // Get menu price
    const menuResult = await pool.query(
      `
      SELECT price FROM menus WHERE menu_id = $1 AND is_available = true
    `,
      [menu_id]
    );

    if (menuResult.rows.length === 0) {
      throw new Error("Menu not found or not available");
    }

    const unit_price = menuResult.rows[0].price;
    const calculated_total_price = unit_price * quantity;

    // Add to order_menus table
    const result = await pool.query(
      `
      INSERT INTO order_menus (order_id, menu_id, quantity, unit_price, total_price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [
        order_id,
        menu_id,
        quantity,
        unit_price,
        calculated_total_price
      ]
    );

    // Update order totals
    await updateOrderTotals(order_id);

    // Get updated order details to show current items
    const orderDetails = await getOrderByIdService(order_id);
    if (orderDetails) {
      // Count products and menus from items array
      const products =
        orderDetails.items?.filter((item) => item.item_type === "product") ||
        [];
      const menus =
        orderDetails.items?.filter((item) => item.item_type === "menu") || [];
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// Get order details
export const getOrderByIdService = async (order_id) => {
  const orderResult = await pool.query(
    `
    SELECT * FROM order_summary_view
    WHERE order_id = $1
  `,
    [order_id]
  );

  if (orderResult.rows.length === 0) {
    return null;
  }

  const order = orderResult.rows[0];

  // Get order products
  const productsResult = await pool.query(
    `
    SELECT
      order_item_id,
      order_id,
      product_id,
      quantity,
      unit_price,
      total_price,
      status,
      created_at,
      product_name,
      product_description,
      product_preparation_time as preparation_time,
      'product' as item_type
    FROM order_products_view
    WHERE order_id = $1 AND status != 'cancelled'
    ORDER BY created_at
  `,
    [order_id]
  );
  

  // Get order menus
  const menusResult = await pool.query(
    `
    SELECT
      order_menu_id as order_item_id,
      order_id,
      menu_id as product_id,
      quantity,
      unit_price,
      total_price,
      status,
      created_at,
      menu_name as product_name,
      menu_description as product_description,
      menu_preparation_time as preparation_time,
      'menu' as item_type
    FROM order_menus_view
    WHERE order_id = $1 AND status != 'cancelled'
    ORDER BY created_at
  `,
    [order_id]
  );
  

  // Combine all items
  const itemsResult = [...productsResult.rows, ...menusResult.rows];

  order.items = itemsResult;
  return order;
};

// Update order item
export const updateOrderItemService = async (order_item_id, updates) => {
  try {
    const { quantity, status } = updates;
    let updatedItem = null;

    // Update quantity
    if (quantity !== undefined) {
      let qty;
      if (typeof quantity === "string") {
        qty = parseInt(quantity.trim());
      } else if (typeof quantity === "number") {
        qty = quantity;
      } else {
        qty = parseInt(quantity);
      }

      if (isNaN(qty) || qty <= 0) {
        throw new Error(`Invalid quantity value: ${quantity}`);
      }

      // Update quantity in both order_products and order_menus
      let qtyResult = await pool.query(
        `
        UPDATE order_products
        SET quantity = $1
        WHERE order_item_id = $2
        RETURNING *
      `,
        [qty, order_item_id]
      );

      if (qtyResult.rows.length === 0) {
        // Not found in order_products, try order_menus
        qtyResult = await pool.query(
          `
          UPDATE order_menus
          SET quantity = $1
          WHERE order_menu_id = $2
          RETURNING *
        `,
          [qty, order_item_id]
        );
      }

      if (qtyResult.rows.length > 0) {
        updatedItem = qtyResult.rows[0];

        // Recalculate total price
        const newTotalPrice = updatedItem.unit_price * qty;

        // Update total price in both tables
        let updateResult = await pool.query(
          `
          UPDATE order_products
          SET total_price = $1
          WHERE order_item_id = $2
        `,
          [newTotalPrice, order_item_id]
        );

        if (updateResult.rowCount === 0) {
          // Not found in order_products, update in order_menus
          updateResult = await pool.query(
            `
            UPDATE order_menus
            SET total_price = $1
            WHERE order_menu_id = $2
          `,
            [newTotalPrice, order_item_id]
          );
        }
      }
    }

    // Update status
    if (status !== undefined) {
      // Update status in both tables
      let statusResult = await pool.query(
        `
        UPDATE order_products
        SET status = $1
        WHERE order_item_id = $2
        RETURNING *
      `,
        [status, order_item_id]
      );

      if (statusResult.rows.length === 0) {
        // Not found in order_products, update in order_menus
        statusResult = await pool.query(
          `
          UPDATE order_menus
          SET status = $1
          WHERE order_menu_id = $2
          RETURNING *
        `,
          [status, order_item_id]
        );
      }

      if (statusResult.rows.length > 0) {
        updatedItem = statusResult.rows[0];
      }
    }

    if (!updatedItem) {
      // If no update was made, get current item from both tables
      let currentResult = await pool.query(
        `
        SELECT * FROM order_products WHERE order_item_id = $1
      `,
        [order_item_id]
      );

      if (currentResult.rows.length === 0) {
        // Not found in order_products, try order_menus
        currentResult = await pool.query(
          `
          SELECT * FROM order_menus WHERE order_menu_id = $1
        `,
          [order_item_id]
        );
      }

      if (currentResult.rows.length === 0) {
        throw new Error("Order item not found");
      }
      updatedItem = currentResult.rows[0];
    }

    // Update order totals
    const order_id = updatedItem.order_id;
    await updateOrderTotals(order_id);

    return updatedItem;
  } catch (error) {
    throw error;
  }
};

// Remove order item
export const removeOrderItemService = async (order_item_id) => {
  // Try to delete from order_products first
  let result = await pool.query(
    `
    DELETE FROM order_products 
    WHERE order_item_id = $1
    RETURNING order_id
  `,
    [order_item_id]
  );

  if (result.rows.length === 0) {
    // Not found in order_products, try order_menus
    result = await pool.query(
      `
      DELETE FROM order_menus 
      WHERE order_menu_id = $1
      RETURNING order_id
    `,
      [order_item_id]
    );
  }

  if (result.rows.length > 0) {
    // Update order totals
    const order_id = result.rows[0].order_id;
    await updateOrderTotals(order_id);
  }

  return result.rows.length > 0;
};

// Update order status
export const updateOrderStatusService = async (
  order_id,
  status,
  user_id = null
) => {
  const result = await pool.query(
    `
    UPDATE orders SET
      status = $1,
      updated_by = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE order_id = $3
    RETURNING *
  `,
    [status, user_id, order_id]
  );

  return result.rows[0];
};

// Update order totals (helper function)
const updateOrderTotals = async (order_id) => {
  try {
    // Calculate totals from active order products and menus
    const result = await pool.query(
      `
      SELECT
        COALESCE(SUM(total_price), 0) as subtotal
      FROM (
        SELECT total_price FROM order_products WHERE order_id = $1 AND status != 'cancelled'
        UNION ALL
        SELECT total_price FROM order_menus WHERE order_id = $1 AND status != 'cancelled'
      ) combined_items
    `,
      [order_id]
    );

    const { subtotal } = result.rows[0];

    const sub = parseFloat(subtotal) || 0;
    const tax = calculateTax(sub);
    const service = calculateServiceCharge(sub);
    const total = calculateTotal(sub, tax, service);

    const updateResult = await pool.query(
      `
      UPDATE orders SET
        subtotal = $1,
        tax_amount = $2,
        service_charge = $3,
        total_amount = $4
      WHERE order_id = $5
    `,
      [sub, tax, service, total, order_id]
    );
  } catch (error) {
    throw error;
  }
};

// Seat customer at table
export const seatCustomerService = async (
  table_id,
  customer_id = null,
  server_id
) => {
  // Check table status first
  const tableCheck = await pool.query(
    `
    SELECT is_occupied, table_id FROM tables WHERE table_id = $1::VARCHAR
  `,
    [table_id]
  );

  if (tableCheck.rows.length === 0) {
    throw new Error(`Table ${table_id} not found`);
  }

  if (tableCheck.rows[0].is_occupied) {
    throw new Error(`Table ${table_id} is already occupied!`);
  }

  // Mark table as occupied and set current customer
  await pool.query(
    `
    UPDATE tables SET
      is_occupied = true,
      occupied_since = CURRENT_TIMESTAMP,
      current_customer_id = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE table_id = $1::VARCHAR
  `,
    [table_id, customer_id]
  );

  // If customer_id provided, mark reservation as completed
  if (customer_id) {
    const updateResult = await pool.query(
      `
      UPDATE reservations 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = $1 
      AND table_id = $2::VARCHAR 
      AND status IN ('confirmed', 'overdue')
    `,
      [customer_id, table_id]
    );
  }

  // Order creation will be done in separate endpoint
  return { table_id, customer_id, server_id, message: "Customer seated successfully" };
};

// Get available menus
export const getMenusService = async () => {
  const result = await pool.query(`
    SELECT * FROM active_menus
    ORDER BY popularity_score DESC, menu_name
  `);

  return result.rows;
};

// Get menu details with products
export const getMenuDetailsService = async (menu_id) => {
  const menuResult = await pool.query(
    `
    SELECT * FROM menu_details WHERE menu_id = $1
  `,
    [menu_id]
  );

  if (menuResult.rows.length === 0) {
    return null;
  }

  const menu = menuResult.rows[0];

  // Get menu products
  const itemsResult = await pool.query(
    `
    SELECT
      mi.*,
      p.name as product_name,
      p.description as product_description,
      p.price as product_price
    FROM menu_items mi
    JOIN products p ON mi.product_id = p.product_id
    WHERE mi.menu_id = $1
    ORDER BY mi.item_type, mi.display_order
  `,
    [menu_id]
  );

  menu.items = itemsResult.rows;
  return menu;
};

// Close order 
export const closeOrderService = async (
  order_id,
  payment_method = "cash",
  payment_amount = null
) => {
  try {
    // Check if order exists and is open
    const orderResult = await pool.query(
      `
      SELECT * FROM orders WHERE order_id = $1 AND status != 'closed'
    `,
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      throw new Error("Order not found or already closed");
    }

    const order = orderResult.rows[0];

    // Use order total if payment amount not provided
    if (!payment_amount) {
      payment_amount = order.total_amount || 0;
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Close order
      const result = await client.query(
        `
        UPDATE orders 
        SET 
          status = 'closed',
          payment_method = $2,
          payment_amount = $3,
          closed_at = NOW(),
          updated_at = NOW()
        WHERE order_id = $1
        RETURNING *
      `,
        [order_id, payment_method, payment_amount]
      );

      // Mark order products as completed
      await client.query(
        `
        UPDATE order_products 
        SET status = 'completed'
        WHERE order_id = $1 AND status != 'cancelled'
      `,
        [order_id]
      );

      // Mark order menus as completed
      await client.query(
        `
        UPDATE order_menus 
        SET status = 'completed'
        WHERE order_id = $1 AND status != 'cancelled'
      `,
        [order_id]
      );

      // Free the table
      await client.query(
        `
        UPDATE tables
        SET
          is_occupied = false,
          occupied_since = NULL,
          current_customer_id = NULL
        WHERE table_id = $1::VARCHAR
      `,
        [order.table_id]
      );

      // Create bill
      const billNumber = await generateBillNumber(client);
      const billData = {
        order_id: order_id,
        customer_id: order.customer_id,
        bill_number: billNumber,
        subtotal: order.subtotal || 0,
        tax_amount: order.tax_amount || 0,
        discount_amount: order.discount_amount || 0,
        service_charge: order.service_charge || 0,
        total_amount: payment_amount,
        payment_status: "pending",
        server_id: order.server_id,
        issued_by: order.server_id,
      };

      const billResult = await client.query(
        `
        INSERT INTO bills (
      order_id, customer_id, bill_number, subtotal, tax_amount, 
      discount_amount, service_charge, total_amount, payment_status, 
      server_id, issued_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING bill_id
      `,
        [
          billData.order_id,
          billData.customer_id,
          billData.bill_number,
          billData.subtotal,
          billData.tax_amount,
          billData.discount_amount,
          billData.service_charge,
          billData.total_amount,
          billData.payment_status,
          billData.server_id,
          billData.issued_by,
        ]
      );

      const billId = billResult.rows[0].bill_id;

      // Copy order products to bill products
      const orderProducts = await client.query(
        `
        SELECT product_id, quantity, unit_price, total_price
        FROM order_products 
        WHERE order_id = $1
      `,
        [order_id]
      );

      for (const product of orderProducts.rows) {
        await client.query(
          `
          INSERT INTO bill_products (
            bill_id, product_id, quantity, unit_price, total_price, is_menu_item
          ) VALUES ($1, $2, $3, $4, $5, false)
        `,
          [
            billId,
            product.product_id,
            product.quantity,
            product.unit_price,
            product.total_price,
          ]
        );
      }

      // Copy order menus to bill products (with is_menu_item = true)
      const orderMenus = await client.query(
        `
        SELECT menu_id, quantity, unit_price, total_price
        FROM order_menus 
        WHERE order_id = $1
      `,
        [order_id]
      );

      for (const menu of orderMenus.rows) {
        await client.query(
          `
          INSERT INTO bill_products (
            bill_id, menu_id, quantity, unit_price, total_price, is_menu_item
          ) VALUES ($1, $2, $3, $4, $5, true)
        `,
          [
            billId,
            menu.menu_id,
            menu.quantity,
            menu.unit_price,
            menu.total_price,
          ]
        );
      }

      await client.query("COMMIT");

      return { ...result.rows[0], bill_id: billId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    throw error;
  }
};

// Delete order (admin only)
export const deleteOrderService = async (order_id) => {
  try {
    // Check if order exists
    const orderResult = await pool.query(
      `
      SELECT * FROM orders WHERE order_id = $1
    `,
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      throw new Error("Order not found");
    }

    const order = orderResult.rows[0];

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Delete order products
      await client.query(
        `
        DELETE FROM order_products WHERE order_id = $1
      `,
        [order_id]
      );

      // 2. Delete order menus
      await client.query(
        `
        DELETE FROM order_menus WHERE order_id = $1
      `,
        [order_id]
      );

      // 3. Delete order
      const result = await client.query(
        `
        DELETE FROM orders WHERE order_id = $1
        RETURNING *
      `,
        [order_id]
      );

      // 4. If table was occupied, free it
      if (order.status !== "closed") {
        await client.query(
          `
          UPDATE tables
          SET
            is_occupied = false,
            occupied_since = NULL,
            current_customer_id = NULL
          WHERE table_id = $1::VARCHAR
        `,
          [order.table_id]
        );
      }

      await client.query("COMMIT");

      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    throw error;
  }
};

// Cancel order service
export const cancelOrderService = async (order_id) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    // Check if order exists and is not already completed/cancelled/closed
    const orderCheck = await client.query(
      "SELECT order_id, status, table_id FROM orders WHERE order_id = $1",
      [order_id]
    );

    if (orderCheck.rows.length === 0) {
      throw new Error("Order not found");
    }

    const order = orderCheck.rows[0];
    
    if (order.status === 'completed') {
      throw new Error("Cannot cancel a completed order");
    }
    
    if (order.status === 'cancelled') {
      throw new Error("Order is already cancelled");
    }
    
    if (order.status === 'closed') {
      throw new Error("Cannot cancel a closed order");
    }

    // Update order status to cancelled
    const result = await client.query(
      `
      UPDATE orders 
      SET 
        status = 'cancelled',
        updated_at = NOW()
      WHERE order_id = $1
      RETURNING *
      `,
      [order_id]
    );

    // Mark all order products as cancelled
    await client.query(
      `
      UPDATE order_products 
      SET status = 'cancelled'
      WHERE order_id = $1 AND status != 'cancelled'
      `,
      [order_id]
    );

    // Mark all order menus as cancelled
    await client.query(
      `
      UPDATE order_menus 
      SET status = 'cancelled'
      WHERE order_id = $1 AND status != 'cancelled'
      `,
      [order_id]
    );

    // Free the table if order was active
    if (order.table_id) {
      await client.query(
        `
        UPDATE tables 
        SET 
          is_occupied = false,
          occupied_since = NULL,
          current_customer_id = NULL
        WHERE table_id = $1::VARCHAR
        `,
        [order.table_id]
      );
    }

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
