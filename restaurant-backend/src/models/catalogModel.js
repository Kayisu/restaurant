import pool from "../config/db.js";
import { getImageUrls } from "../utils/imageProcessor.js";

// Get all categories
export const getCategoriesService = async () => {
  const result = await pool.query(`
    SELECT 
      category_id,
      name,
      description,
      image_url,
      is_active,
      display_order,
      created_at,
      updated_at
    FROM categories 
    WHERE is_active = true 
    ORDER BY display_order, name
  `);
  return result.rows;
};

// Get subcategories for a category
export const getCategorySubcategoriesService = async (categoryId) => {
  const result = await pool.query(`
    SELECT 
      subcategory_id,
      name,
      description,
      image_url,
      is_active,
      display_order,
      created_at,
      updated_at
    FROM subcategories 
    WHERE category_id = $1 AND is_active = true 
    ORDER BY display_order, name
  `, [categoryId]);
  return result.rows;
};

// Get products for a subcategory
export const getSubcategoryProductsService = async (subcategoryId) => {
  const result = await pool.query(`
    SELECT 
      product_id,
      name,
      description,
      price,
      is_available,
      preparation_time,
      popularity_score,
      display_order,
      image_url,
      created_at,
      updated_at,
      subcategory_name,
      category_name
    FROM subcategory_products_detailed
    WHERE subcategory_id = $1
    ORDER BY display_order, name
  `, [subcategoryId]);
  
  // Add processed images for each product
  const productsWithImages = result.rows.map(product => {
    if (product.image_url) {
      const filename = product.image_url.split('/').pop();
      const processedImages = getImageUrls('product', filename);
      return {
        ...product,
        processedImages
      };
    }
    return product;
  });
  
  return productsWithImages;
};

// Get all active products
export const getActiveProductsService = async () => {
  const result = await pool.query(`
    SELECT * FROM active_products
    ORDER BY category_name, subcategory_name, name
  `);
  
  return result.rows;
};

// Search products
export const searchProductsService = async (query) => {
  const searchTerm = `%${query}%`;
  const result = await pool.query(`
    SELECT 
      product_id,
      name,
      description,
      price,
      is_available,
      preparation_time,
      popularity_score,
      display_order,
      image_url,
      created_at,
      updated_at,
      subcategory_name,
      category_name
    FROM search_products_detailed
    WHERE (name ILIKE $1 OR description ILIKE $1)
    ORDER BY popularity_score DESC, name
  `, [searchTerm]);
  
  // Add processed images for each product
  const productsWithImages = result.rows.map(product => {
    if (product.image_url) {
      const filename = product.image_url.split('/').pop();
      const processedImages = getImageUrls('product', filename);
      return {
        ...product,
        processedImages
      };
    }
    return product;
  });
  
  return productsWithImages;
};

export const getProductByIdService = async (productId) => {
  const result = await pool.query(`
    SELECT * FROM product_details
    WHERE product_id = $1
  `, [productId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
};

// Get product options
export const getProductOptionsService = async (productId) => {
  const result = await pool.query(`
    SELECT 
      po.option_id,
      po.option_name,
      po.option_type,
      po.price_modifier,
      po.is_available,
      po.display_order,
      po.created_at
    FROM product_options po
    WHERE po.product_id = $1 AND po.is_available = true
    ORDER BY po.display_order, po.option_name
  `, [productId]);
  return result.rows;
};

// Create category
export const createCategoryService = async (categoryData, userId) => {
  const { name, description, image_url } = categoryData;
  
  const result = await pool.query(`
    INSERT INTO categories (name, description, image_url, created_by, updated_by)
    VALUES ($1, $2, $3, $4, $4)
    RETURNING *
  `, [name, description, image_url, userId]);
  
  return result.rows[0];
};

// Update category
export const updateCategoryService = async (categoryId, categoryData, userId) => {
  const { name, description, image_url, is_active } = categoryData;
  
  const result = await pool.query(`
    UPDATE categories 
    SET 
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      image_url = COALESCE($4, image_url),
      is_active = COALESCE($5, is_active),
      updated_by = $6,
      updated_at = CURRENT_TIMESTAMP
    WHERE category_id = $1
    RETURNING *
  `, [categoryId, name, description, image_url, is_active, userId]);
  
  return result.rows[0];
};

// Delete category (soft delete - set is_active = false)
export const deleteCategoryService = async (categoryId, userId) => {
  const result = await pool.query(`
    UPDATE categories 
    SET 
      is_active = false,
      updated_by = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE category_id = $1
    RETURNING *
  `, [categoryId, userId]);
  
  return result.rows[0];
};

export const getCategoryByIdService = async (categoryId) => {
  const result = await pool.query(`
    SELECT 
      category_id,
      name,
      description,
      image_url,
      is_active,
      display_order,
      created_by,
      updated_by,
      created_at,
      updated_at
    FROM categories 
    WHERE category_id = $1
  `, [categoryId]);
  
  return result.rows[0];
};

// Get all categories (including inactive - for admin)
export const getAllCategoriesService = async () => {
  const result = await pool.query(`
    SELECT 
      category_id,
      name,
      description,
      image_url,
      is_active,
      display_order,
      created_by,
      updated_by,
      created_at,
      updated_at
    FROM categories 
    ORDER BY display_order, name
  `);
  
  return result.rows;
};

// Create subcategory
export const createSubcategoryService = async (subcategoryData, userId) => {
  const { category_id, name, description, image_url } = subcategoryData;
  
  const result = await pool.query(`
    INSERT INTO subcategories (category_id, name, description, image_url, created_by, updated_by)
    VALUES ($1, $2, $3, $4, $5, $5)
    RETURNING *
  `, [category_id, name, description, image_url, userId]);
  
  return result.rows[0];
};

// Update subcategory
export const updateSubcategoryService = async (subcategoryId, subcategoryData, userId) => {
  const { name, description, image_url, is_active } = subcategoryData;
  
  const result = await pool.query(`
    UPDATE subcategories 
    SET 
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      image_url = COALESCE($4, image_url),
      is_active = COALESCE($5, is_active),
      updated_by = $6,
      updated_at = CURRENT_TIMESTAMP
    WHERE subcategory_id = $1
    RETURNING *
  `, [subcategoryId, name, description, image_url, is_active, userId]);
  
  return result.rows[0];
};

// Delete subcategory (soft delete - set is_active = false)
export const deleteSubcategoryService = async (subcategoryId, userId) => {
  const result = await pool.query(`
    UPDATE subcategories 
    SET 
      is_active = false,
      updated_by = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE subcategory_id = $1
    RETURNING *
  `, [subcategoryId, userId]);
  
  return result.rows[0];
};

export const getSubcategoryByIdService = async (subcategoryId) => {
  const result = await pool.query(`
    SELECT 
      s.subcategory_id,
      s.category_id,
      s.name,
      s.description,
      s.image_url,
      s.is_active,
      s.display_order,
      s.created_by,
      s.updated_by,
      s.created_at,
      s.updated_at,
      c.name as category_name
    FROM subcategories s
    JOIN categories c ON s.category_id = c.category_id
    WHERE s.subcategory_id = $1
  `, [subcategoryId]);
  
  return result.rows[0];
};

// Get all subcategories (including inactive - for admin)
export const getAllSubcategoriesService = async () => {
  const result = await pool.query(`
    SELECT 
      s.subcategory_id,
      s.category_id,
      s.name,
      s.description,
      s.image_url,
      s.is_active,
      s.display_order,
      s.created_by,
      s.updated_by,
      s.created_at,
      s.updated_at,
      c.name as category_name
    FROM subcategories s
    JOIN categories c ON s.category_id = c.category_id
    ORDER BY c.display_order, s.display_order, s.name
  `);
  
  return result.rows;
};

// Create product
export const createProductService = async (productData, userId) => {
  const { subcategory_id, name, description, price, image_url, preparation_time } = productData;
  
  // Generate product_id: category.subcategory.product
  const categoryResult = await pool.query(`
    SELECT c.category_id 
    FROM categories c 
    JOIN subcategories s ON c.category_id = s.category_id 
    WHERE s.subcategory_id = $1
  `, [subcategory_id]);
  
  if (categoryResult.rows.length === 0) {
    throw new Error('Subcategory not found');
  }
  
  const category_id = categoryResult.rows[0].category_id;
  
  // Get next product number in this subcategory
  const countResult = await pool.query(`
    SELECT COUNT(*) as count 
    FROM products 
    WHERE subcategory_id = $1
  `, [subcategory_id]);
  
  const product_number = parseInt(countResult.rows[0].count) + 1;
  const product_id = `${category_id}.${subcategory_id}.${product_number}`;
  
  const result = await pool.query(`
    INSERT INTO products (product_id, subcategory_id, name, description, price, image_url, preparation_time, created_by, updated_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
    RETURNING *
  `, [product_id, subcategory_id, name, description, price, image_url, preparation_time, userId]);
  
  return result.rows[0];
};

// Update product
export const updateProductService = async (productId, productData, userId) => {
  const { name, description, price, image_url, preparation_time, is_available } = productData;
  
  const result = await pool.query(`
    UPDATE products 
    SET 
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      price = COALESCE($4, price),
      image_url = COALESCE($5, image_url),
      preparation_time = COALESCE($6, preparation_time),
      is_available = COALESCE($7, is_available),
      updated_by = $8,
      updated_at = CURRENT_TIMESTAMP
    WHERE product_id = $1
    RETURNING *
  `, [productId, name, description, price, image_url, preparation_time, is_available, userId]);
  
  return result.rows[0];
};

export const deleteProductService = async (productId, userId) => {
  const result = await pool.query(`
    UPDATE products 
    SET 
      is_available = false,
      updated_by = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE product_id = $1
    RETURNING *
  `, [productId, userId]);
  
  return result.rows[0];
};

export const getProductByIdAdminService = async (productId) => {
  const result = await pool.query(`
    SELECT 
      p.product_id,
      p.subcategory_id,
      p.name,
      p.description,
      p.price,
      p.image_url,
      p.preparation_time,
      p.is_available,
      p.created_by,
      p.updated_by,
      p.created_at,
      p.updated_at,
      s.name as subcategory_name,
      c.name as category_name,
      c.category_id
    FROM products p
    JOIN subcategories s ON p.subcategory_id = s.subcategory_id
    JOIN categories c ON s.category_id = c.category_id
    WHERE p.product_id = $1
  `, [productId]);
  
  return result.rows[0];
};

// Get all products (including inactive - for admin)
export const getAllProductsService = async () => {
  const result = await pool.query(`
    SELECT 
      p.product_id,
      p.subcategory_id,
      p.name,
      p.description,
      p.price,
      p.image_url,
      p.preparation_time,
      p.is_available,
      p.created_by,
      p.updated_by,
      p.created_at,
      p.updated_at,
      s.name as subcategory_name,
      c.name as category_name,
      c.category_id
    FROM products p
    JOIN subcategories s ON p.subcategory_id = s.subcategory_id
    JOIN categories c ON s.category_id = c.category_id
    ORDER BY c.category_id, s.subcategory_id, p.product_id
  `);
  
  return result.rows;
};

// Hard delete category (permanently delete)
export const hardDeleteCategoryService = async (categoryId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Check if category exists
    const categoryCheck = await client.query(`
      SELECT category_id, name FROM categories WHERE category_id = $1
    `, [categoryId]);
    
    if (categoryCheck.rows.length === 0) {
      throw new Error('Category not found');
    }
    
    // 2. Check if category has subcategories
    const subcategoriesCheck = await client.query(`
      SELECT COUNT(*) as count FROM subcategories WHERE category_id = $1
    `, [categoryId]);
    
    if (parseInt(subcategoriesCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete category with subcategories. Delete subcategories first.');
    }
    
    // 3. Check if category has products through subcategories
    const productsCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM products p
      JOIN subcategories s ON p.subcategory_id = s.subcategory_id
      WHERE s.category_id = $1
    `, [categoryId]);
    
    if (parseInt(productsCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete category with products. Delete products first.');
    }
    
    // 4. Check if category products are used in active orders
    const activeOrdersCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM order_products op
      JOIN products p ON op.product_id = p.product_id
      JOIN subcategories s ON p.subcategory_id = s.subcategory_id
      JOIN orders o ON op.order_id = o.order_id
      WHERE s.category_id = $1 
      AND o.status NOT IN ('completed', 'cancelled', 'closed')
    `, [categoryId]);
    
    if (parseInt(activeOrdersCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete category with products in active orders. Complete or cancel orders first.');
    }
    
    // 5. Check if category products are used in bills
    const billsCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM bill_products bp
      JOIN products p ON bp.product_id = p.product_id
      JOIN subcategories s ON p.subcategory_id = s.subcategory_id
      WHERE s.category_id = $1
    `, [categoryId]);
    
    if (parseInt(billsCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete category with products in bills. Remove from bills first.');
    }
    
    // 4. Hard delete category
    const result = await client.query(`
      DELETE FROM categories WHERE category_id = $1 RETURNING *
    `, [categoryId]);
    
    await client.query('COMMIT');
    return result.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Hard delete subcategory (permanently delete)
export const hardDeleteSubcategoryService = async (subcategoryId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Check if subcategory exists
    const subcategoryCheck = await client.query(`
      SELECT subcategory_id, name FROM subcategories WHERE subcategory_id = $1
    `, [subcategoryId]);
    
    if (subcategoryCheck.rows.length === 0) {
      throw new Error('Subcategory not found');
    }
    
    // 2. Check if subcategory has products
    const productsCheck = await client.query(`
      SELECT COUNT(*) as count FROM products WHERE subcategory_id = $1
    `, [subcategoryId]);
    
    if (parseInt(productsCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete subcategory with products. Delete products first.');
    }
    
    // 3. Check if subcategory is used in menu_items
    const menuItemsCheck = await client.query(`
      SELECT COUNT(*) as count FROM menu_items mi
      JOIN products p ON mi.product_id = p.product_id
      WHERE p.subcategory_id = $1
    `, [subcategoryId]);
    
    if (parseInt(menuItemsCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete subcategory used in menu items. Remove from menus first.');
    }
    
    // 4. Check if subcategory products are used in active orders
    const activeOrdersCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM order_products op
      JOIN products p ON op.product_id = p.product_id
      JOIN orders o ON op.order_id = o.order_id
      WHERE p.subcategory_id = $1 
      AND o.status NOT IN ('completed', 'cancelled', 'closed')
    `, [subcategoryId]);
    
    if (parseInt(activeOrdersCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete subcategory with products in active orders. Complete or cancel orders first.');
    }
    
    // 5. Check if subcategory products are used in bills
    const billsCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM bill_products bp
      JOIN products p ON bp.product_id = p.product_id
      WHERE p.subcategory_id = $1
    `, [subcategoryId]);
    
    if (parseInt(billsCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete subcategory with products in bills. Remove from bills first.');
    }
    
    // 4. Hard delete subcategory
    const result = await client.query(`
      DELETE FROM subcategories WHERE subcategory_id = $1 RETURNING *
    `, [subcategoryId]);
    
    await client.query('COMMIT');
    return result.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Hard delete product (permanently delete)
export const hardDeleteProductService = async (productId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Check if product exists
    const productCheck = await client.query(`
      SELECT product_id, name FROM products WHERE product_id = $1
    `, [productId]);
    
    if (productCheck.rows.length === 0) {
      throw new Error('Product not found');
    }
    
    // 2. Check if product is used in ACTIVE orders only
    const ordersCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM order_products op
      JOIN orders o ON op.order_id = o.order_id
      WHERE op.product_id = $1 
      AND o.status NOT IN ('completed', 'cancelled', 'closed')
    `, [productId]);
    
    if (parseInt(ordersCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete product used in active orders. Remove from active orders first.');
    }
    
    // 3. Check if product is used in bills
    const billsCheck = await client.query(`
      SELECT COUNT(*) as count FROM bill_products WHERE product_id = $1
    `, [productId]);
    
    if (parseInt(billsCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete product used in bills. Remove from bills first.');
    }
    
    // 4. Check if product is used in menus
    const menusCheck = await client.query(`
      SELECT COUNT(*) as count FROM menu_items WHERE product_id = $1
    `, [productId]);
    
    if (parseInt(menusCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete product used in menus. Remove from menus first.');
    }
    
    
    // 6. Delete from order_products (for hard delete)
    await client.query(`
      DELETE FROM order_products WHERE product_id = $1
    `, [productId]);
    
    // 7. Hard delete product
    const result = await client.query(`
      DELETE FROM products WHERE product_id = $1 RETURNING *
    `, [productId]);
    
    await client.query('COMMIT');
    return result.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
