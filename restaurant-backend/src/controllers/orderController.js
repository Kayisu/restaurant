import pool from "../config/db.js";
import {
  createOrderService,
  createOrderAfterSeatingService,
  addProductToOrderService,
  addMenuToOrderService,
  getOrderByIdService,
  getAllOrdersService,
  updateOrderItemService,
  removeOrderItemService,
  updateOrderStatusService,
  seatCustomerService,
  getMenusService,
  getMenuDetailsService,
  closeOrderService,
  deleteOrderService,
  cancelOrderService
} from "../models/orderModel.js";



export const getAllOrders = async (req, res) => {
  try {
    const orders = await getAllOrdersService();
    res.json({
      success: true,
      message: "Orders retrieved successfully",
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get orders'
    });
  }
};

export const seatCustomer = async (req, res) => {
  try {
    const { table_id, customer_id } = req.body;
    const server_id = req.user?.user_id; // User from JWT

    const result = await seatCustomerService(table_id, customer_id, server_id);
    res.json({
      success: true,
      message: "Customer seated successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to seat customer'
    });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { table_id, customer_id } = req.body;
    const server_id = req.user?.user_id; // User from JWT

    // If customer_id not provided, get it from table's current_customer_id
    let finalCustomerId = customer_id;
    if (!finalCustomerId) {
      const tableResult = await pool.query(`
        SELECT current_customer_id FROM tables WHERE table_id = $1
      `, [table_id]);
      
      if (tableResult.rows.length > 0) {
        finalCustomerId = tableResult.rows[0].current_customer_id;
      }
    }

    const order = await createOrderAfterSeatingService(table_id, finalCustomerId, server_id);
    res.json({
      success: true,
      message: "Order created successfully",
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
};

export const addFromCatalog = async (req, res) => {
  try {
    const { order_id, product_id, quantity = 1 } = req.body;

    const orderItem = await addProductToOrderService(
      order_id,
      product_id,
      quantity
    );

    res.json({
      success: true,
      message: "Product added to cart successfully",
      data: orderItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add product'
    });
  }
};

export const addFromMenu = async (req, res) => {
  try {
    const { order_id, menu_id, quantity = 1 } = req.body;

    const orderItem = await addMenuToOrderService(
      order_id,
      menu_id,
      quantity
    );

    res.json({
      success: true,
      message: "Menu added to cart successfully",
      data: orderItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add menu'
    });
  }
};

export const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await getOrderByIdService(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get order details'
    });
  }
};

export const updateOrderItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;

    // Convert itemId to integer
    const parsedItemId = parseInt(itemId);
    if (isNaN(parsedItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID'
      });
    }

    const updatedItem = await updateOrderItemService(parsedItemId, updates);
    res.json({
      success: true,
      message: "Order item updated successfully",
      data: updatedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order item'
    });
  }
};

export const removeOrderItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const deleted = await removeOrderItemService(itemId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found'
      });
    }

    res.json({
      success: true,
      message: "Order item deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete order item'
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const user_id = req.user?.user_id;

    const updatedOrder = await updateOrderStatusService(orderId, status, user_id);
    res.json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

export const getMenus = async (req, res) => {
  try {
    const menus = await getMenusService();
    res.json({
      success: true,
      data: menus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get menus'
    });
  }
};

export const getMenuDetails = async (req, res) => {
  try {
    const { menuId } = req.params;
    const menu = await getMenuDetailsService(menuId);

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    res.json({
      success: true,
      data: menu
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get menu details'
    });
  }
};

export const getTableActiveOrder = async (req, res) => {
  try {
    const { tableId } = req.params;

    const result = await pool.query(`
      SELECT o.order_id, o.status
      FROM orders o
      WHERE o.table_id = $1
        AND o.status NOT IN ('completed', 'cancelled', 'closed')
      ORDER BY o.order_date DESC
      LIMIT 1
    `, [tableId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active orders found for this table'
      });
    }

    const orderId = result.rows[0].order_id;
    const order = await getOrderByIdService(orderId);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get table orders'
    });
  }
};

export const closeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payment_method = 'cash', payment_amount } = req.body;

    const closedOrder = await closeOrderService(orderId, payment_method, payment_amount);

    res.json({
      success: true,
      message: "Order closed successfully and payment received",
      data: closedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to close order'
    });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const deletedOrder = await deleteOrderService(orderId);

    res.json({
      success: true,
      message: "Order deleted successfully",
      data: deletedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete order'
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const cancelledOrder = await cancelOrderService(orderId);

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: cancelledOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel order'
    });
  }
};
