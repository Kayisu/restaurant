
import pool from '../config/db.js';
import { getImageUrls } from '../utils/imageProcessor.js';


// Create menu
export const createMenuService = async (menuData, userId) => {
    const { menu_name, description, price, image_url, preparation_time } = menuData;
    
    const result = await pool.query(`
      INSERT INTO menus (menu_name, description, price, image_url, preparation_time, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $6)
      RETURNING *
    `, [menu_name, description, price, image_url, preparation_time, userId]);
    
    return result.rows[0];
  };
  
  // Update menu
  export const updateMenuService = async (menuId, menuData, userId) => {
    const { menu_name, description, price, image_url, preparation_time, is_available } = menuData;
    
    const result = await pool.query(`
      UPDATE menus 
      SET 
        menu_name = COALESCE($2, menu_name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        image_url = COALESCE($5, image_url),
        preparation_time = COALESCE($6, preparation_time),
        is_available = COALESCE($7, is_available),
        updated_by = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE menu_id = $1
      RETURNING *
    `, [menuId, menu_name, description, price, image_url, preparation_time, is_available, userId]);
    
    return result.rows[0];
  };
  
  // Delete menu (soft delete - set is_available = false)
  export const deleteMenuService = async (menuId, userId) => {
    const result = await pool.query(`
      UPDATE menus 
      SET 
        is_available = false,
        updated_by = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE menu_id = $1
      RETURNING *
    `, [menuId, userId]);
    
    return result.rows[0];
  };
  
  export const getMenuByIdAdminService = async (menuId) => {
    const result = await pool.query(`
      SELECT 
        m.menu_id,
        m.menu_name,
        m.description,
        m.price,
        m.image_url,
        m.is_available,
        m.preparation_time,
        m.created_by,
        m.updated_by,
        m.created_at,
        m.updated_at
      FROM menus m
      WHERE m.menu_id = $1
    `, [menuId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const menu = result.rows[0];
    
    // Add processed images if image_url exists
    if (menu.image_url) {
      const filename = menu.image_url.split('/').pop();
      const processedImages = getImageUrls('menu', filename);
      return {
        ...menu,
        processedImages
      };
    }
    
    return menu;
  };
  
  // Get all active menus (for staff/public)
  export const getAllMenusService = async () => {
    const result = await pool.query(`
      SELECT * FROM active_menus
      ORDER BY menu_id
    `);
    
    return result.rows;
  };

  // Get all menus including inactive (for admin)
  export const getAllMenusForAdminService = async () => {
    const result = await pool.query(`
      SELECT 
        m.menu_id,
        m.menu_name,
        m.description,
        m.price,
        m.image_url,
        m.preparation_time,
        m.is_available,
        m.created_at,
        m.updated_at,
        COUNT(mi.menu_item_id)::int as item_count
      FROM menus m
      LEFT JOIN menu_items mi ON m.menu_id = mi.menu_id
      GROUP BY m.menu_id
      ORDER BY m.menu_id
    `);
    
    return result.rows;
  };

  
  // Add product to menu
  export const addProductToMenuService = async (menuId, productId, quantity, userId) => {
    const result = await pool.query(`
      INSERT INTO menu_items (menu_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (menu_id, product_id) 
      DO UPDATE SET 
        quantity = $3
      RETURNING *
    `, [menuId, productId, quantity]);
    
    return result.rows[0];
  };
  
  // Remove product from menu
  export const removeProductFromMenuService = async (menuId, productId) => {
    const result = await pool.query(`
      DELETE FROM menu_items 
      WHERE menu_id = $1 AND product_id = $2
      RETURNING *
    `, [menuId, productId]);
    
    return result.rows[0];
  };
  
  // Update product quantity in menu
  export const updateMenuProductQuantityService = async (menuId, productId, quantity, userId) => {
    const result = await pool.query(`
      UPDATE menu_items 
      SET 
        quantity = $3
      WHERE menu_id = $1 AND product_id = $2
      RETURNING *
    `, [menuId, productId, quantity]);
    
    return result.rows[0];
  };
  
  // Get menu items with calculated price
export const getMenuItemsWithCalculatedPriceService = async (menuId) => {
  const result = await pool.query(`
      SELECT 
        m.menu_id,
        m.menu_name,
        m.description,
        m.price as manual_price,
        m.image_url,
        m.is_available,
        COALESCE(SUM(mi.quantity * p.price), 0) as calculated_price,
        COALESCE(SUM(mi.quantity * p.price), 0) - m.price as price_difference,
        COUNT(mi.product_id) as items_count
      FROM menus m
      LEFT JOIN menu_items mi ON m.menu_id = mi.menu_id
      LEFT JOIN products p ON mi.product_id = p.product_id
      WHERE m.menu_id = $1
      GROUP BY m.menu_id, m.menu_name, m.description, m.price, m.image_url, m.is_available
    `, [menuId]);
    
    return result.rows[0];
  };
  
  
  
  export const getAllMenuItemsService = async (menuId) => {
    const menuInfo = await getMenuItemsWithCalculatedPriceService(menuId);
    
    // Get menu items with product details (inline)
    const itemsResult = await pool.query(`
      SELECT 
        mi.menu_item_id,
        mi.menu_id,
        mi.product_id,
        mi.quantity,
        mi.is_required,
        mi.item_type,
        mi.display_order,
        p.name as product_name,
        p.description as product_description,
        p.price as product_price,
        p.image_url as product_image,
        p.is_available as product_available,
        s.name as subcategory_name,
        c.name as category_name
      FROM menu_items mi
      JOIN products p ON mi.product_id = p.product_id
      JOIN subcategories s ON p.subcategory_id = s.subcategory_id
      JOIN categories c ON s.category_id = c.category_id
      WHERE mi.menu_id = $1
      ORDER BY mi.display_order, mi.menu_item_id
    `, [menuId]);
    
    return {
      menu_info: menuInfo,
      items: itemsResult.rows
    };
  };



// Hard delete menu (permanently delete)
export const hardDeleteMenuService = async (menuId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Check if menu exists
    const menuCheck = await client.query(`
      SELECT menu_id, menu_name FROM menus WHERE menu_id = $1
    `, [menuId]);
    
    if (menuCheck.rows.length === 0) {
      throw new Error('Menu not found');
    }
    
    // 2. Check if menu is used in ACTIVE orders only
    const ordersCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM order_menus om
      JOIN orders o ON om.order_id = o.order_id
      WHERE om.menu_id = $1 
      AND o.status NOT IN ('completed', 'cancelled', 'closed')
    `, [menuId]);
    
    if (parseInt(ordersCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete menu used in active orders. Remove from active orders first.');
    }
    
    // 3. Check if menu is used in bills
    const billsCheck = await client.query(`
      SELECT COUNT(*) as count FROM bill_products WHERE menu_id = $1
    `, [menuId]);
    
    if (parseInt(billsCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete menu used in bills. Remove from bills first.');
    }
    
    // 4. Delete menu items first (cascade should handle this, but being explicit)
    await client.query(`
      DELETE FROM menu_items WHERE menu_id = $1
    `, [menuId]);
    
    // 5. Delete from order_menus (for hard delete)
    await client.query(`
      DELETE FROM order_menus WHERE menu_id = $1
    `, [menuId]);
    
    // 6. Hard delete menu
    const result = await client.query(`
      DELETE FROM menus WHERE menu_id = $1 RETURNING *
    `, [menuId]);
    
    await client.query('COMMIT');
    return result.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};