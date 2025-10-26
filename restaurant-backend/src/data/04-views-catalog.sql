- Drop existing views
DROP VIEW IF EXISTS active_products CASCADE;
DROP VIEW IF EXISTS active_menus CASCADE;
DROP VIEW IF EXISTS product_details CASCADE;
DROP VIEW IF EXISTS menu_details CASCADE;
DROP VIEW IF EXISTS subcategory_products_detailed CASCADE;
DROP VIEW IF EXISTS search_products_detailed CASCADE;

-- Active Products View
CREATE OR REPLACE VIEW active_products AS
SELECT 
  p.product_id, 
  p.name, 
  p.description,
  p.price,
  p.image_url,
  p.is_available,
  s.name as subcategory_name,
  s.subcategory_id,
  c.name as category_name,
  c.category_id
FROM products p
JOIN subcategories s ON p.subcategory_id = s.subcategory_id
JOIN categories c ON s.category_id = c.category_id
WHERE p.is_available = true AND s.is_active = true AND c.is_active = true
ORDER BY c.name, s.name, p.name;

-- Active Menus View
CREATE OR REPLACE VIEW active_menus AS
SELECT 
  m.menu_id,
  m.menu_name,
  m.description,
  m.price,
  m.image_url,
  m.is_available,
  m.popularity_score
FROM menus m
WHERE m.is_available = true
ORDER BY m.menu_name;

-- Product Details View (with processed images)
CREATE OR REPLACE VIEW product_details AS
SELECT 
  p.product_id,
  p.name,
  p.description,
  p.price,
  p.image_url,
  p.is_available,
  p.popularity_score,
  p.display_order,
  s.name as subcategory_name,
  s.subcategory_id,
  c.name as category_name,
  c.category_id,
  -- Processed images (card and detail)
  CASE 
    WHEN p.image_url IS NOT NULL THEN
      json_build_object(
        'original', p.image_url,
        'card', REPLACE(p.image_url, '.', '_card.'),
        'detail', REPLACE(p.image_url, '.', '_detail.')
      )
    ELSE NULL
  END as processed_images
FROM products p
JOIN subcategories s ON p.subcategory_id = s.subcategory_id
JOIN categories c ON s.category_id = c.category_id
WHERE p.is_available = true AND s.is_active = true AND c.is_active = true
ORDER BY c.name, s.name, p.name;

-- Menu Details View (with processed images)
CREATE OR REPLACE VIEW menu_details AS
SELECT 
  m.menu_id,
  m.menu_name,
  m.description,
  m.price,
  m.image_url,
  m.is_available,
  m.popularity_score,
  COUNT(mi.product_id) as item_count,
  -- Processed images (card and detail)
  CASE 
    WHEN m.image_url IS NOT NULL THEN
      json_build_object(
        'original', m.image_url,
        'card', REPLACE(m.image_url, '.', '_card.'),
        'detail', REPLACE(m.image_url, '.', '_detail.')
      )
    ELSE NULL
  END as processed_images
FROM menus m
LEFT JOIN menu_items mi ON m.menu_id = mi.menu_id
WHERE m.is_available = true
GROUP BY m.menu_id, m.menu_name, m.description, m.price, m.image_url, 
         m.is_available, m.popularity_score
ORDER BY m.menu_name;


-- Detailed Subcategory Products View (individual products with all fields)
CREATE OR REPLACE VIEW subcategory_products_detailed AS
SELECT 
  p.product_id,
  p.name,
  p.description,
  p.price,
  p.is_available,
  p.preparation_time,
  p.popularity_score,
  p.display_order,
  p.image_url,
  p.created_at,
  p.updated_at,
  s.name as subcategory_name,
  s.subcategory_id,
  c.name as category_name,
  c.category_id
FROM products p
JOIN subcategories s ON p.subcategory_id = s.subcategory_id
JOIN categories c ON s.category_id = c.category_id
WHERE p.is_available = true AND s.is_active = true AND c.is_active = true
ORDER BY c.name, s.name, p.display_order, p.name;

-- Search Products View (for search functionality with all fields)
CREATE OR REPLACE VIEW search_products_detailed AS
SELECT 
  p.product_id,
  p.name,
  p.description,
  p.price,
  p.is_available,
  p.preparation_time,
  p.popularity_score,
  p.display_order,
  p.image_url,
  p.created_at,
  p.updated_at,
  s.name as subcategory_name,
  s.subcategory_id,
  c.name as category_name,
  c.category_id
FROM products p
JOIN subcategories s ON p.subcategory_id = s.subcategory_id
JOIN categories c ON s.category_id = c.category_id
WHERE p.is_available = true AND s.is_active = true AND c.is_active = true
ORDER BY p.popularity_score DESC, p.name;


