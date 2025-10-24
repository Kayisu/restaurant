import pool from "../config/db.js";

/**
 * Generate next product ID in format: category.subcategory.product
 * Example: 1.2.5 (category 1, subcategory 2, product 5)
 */
export const generateProductId = async (subcategoryId) => {
  try {
    // Get category info and subcategory position
    const categoryQuery = `
      SELECT 
        s.category_id,
        ROW_NUMBER() OVER (PARTITION BY s.category_id ORDER BY s.subcategory_id) as subcategory_position
      FROM subcategories s 
      WHERE s.subcategory_id = $1
    `;
    const categoryResult = await pool.query(categoryQuery, [subcategoryId]);
    
    if (categoryResult.rows.length === 0) {
      throw new Error('Subcategory not found');
    }
    
    const { category_id, subcategory_position } = categoryResult.rows[0];
    
    // Get next product number for this subcategory
    const productQuery = `
      SELECT COALESCE(
        MAX(CAST(split_part(product_id, '.', 3) AS INT)), 
        0
      ) + 1 as next_product_num
      FROM products 
      WHERE subcategory_id = $1 
      AND product_id ~ '^[0-9]+\\.[0-9]+\\.[0-9]+$'
    `;
    const productResult = await pool.query(productQuery, [subcategoryId]);
    const nextProductNum = productResult.rows[0].next_product_num;
    
    return `${category_id}.${subcategory_position}.${nextProductNum}`;
  } catch (error) {
    throw error;
  }
};

/**
 * Generate next table ID in format: Zone-Number  
 * Example: A-01, B-05
 */
export const generateTableId = async (zone = 'A') => {
  try {
    const query = `
      SELECT COALESCE(
        MAX(CAST(split_part(table_id, '-', 2) AS INT)), 
        0
      ) + 1 as next_table_num
      FROM tables 
      WHERE table_id LIKE $1
    `;
    const result = await pool.query(query, [`${zone}-%`]);
    const nextTableNum = result.rows[0].next_table_num;
    
    // Pad with zeros: A-01, A-02, etc.
    return `${zone}-${nextTableNum.toString().padStart(2, '0')}`;
  } catch (error) {
    throw error;
  }
};

/**
 * Validate ID formats
 */
export const validateProductId = (productId) => {
  const pattern = /^[0-9]+\.[0-9]+\.[0-9]+$/;
  return pattern.test(productId);
};

export const validateTableId = (tableId) => {
  const pattern = /^[A-Z]-[0-9]{2}$/;
  return pattern.test(tableId);
};

/**
 * Parse product ID to get component parts
 */
export const parseProductId = (productId) => {
  if (!validateProductId(productId)) {
    throw new Error('Invalid product ID format');
  }
  
  const [categoryId, subcategoryPos, productNum] = productId.split('.').map(Number);
  return {
    categoryId,
    subcategoryPosition: subcategoryPos,
    productNumber: productNum
  };
};

/**
 * Parse table ID to get component parts
 */
export const parseTableId = (tableId) => {
  if (!validateTableId(tableId)) {
    throw new Error('Invalid table ID format');
  }
  
  const [zone, number] = tableId.split('-');
  return {
    zone,
    number: parseInt(number, 10)
  };
};

/**
 * Get next available display order for a table
 */
export const getNextDisplayOrder = async (tableName, parentColumn = null, parentValue = null) => {
  try {
    let query = `SELECT COALESCE(MAX(display_order), 0) + 10 as next_order FROM ${tableName}`;
    let params = [];
    
    if (parentColumn && parentValue) {
      query += ` WHERE ${parentColumn} = $1`;
      params.push(parentValue);
    }
    
    const result = await pool.query(query, params);
    return result.rows[0].next_order;
  } catch (error) {
    throw error;
  }
};
