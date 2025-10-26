-- Drop existing views
DROP VIEW IF EXISTS order_summary_view CASCADE;
DROP VIEW IF EXISTS order_details_view CASCADE;
DROP VIEW IF EXISTS order_products_view CASCADE;
DROP VIEW IF EXISTS order_menus_view CASCADE;

-- Order Summary View
CREATE OR REPLACE VIEW order_summary_view AS
SELECT
    o.order_id,  o.customer_id,
    o.table_id,o.order_type,
    o.status,o.subtotal,
    o.tax_amount,o.discount_amount,
    o.service_charge,o.total_amount,
    o.payment_status,o.completed_at,
    o.order_date,o.server_id,
    c.name AS customer_name,
    c.phone_number AS customer_phone,
    u.user_name AS server_name,
    t.capacity AS table_capacity
    
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN users u ON o.server_id = u.user_id
LEFT JOIN tables t ON o.table_id = t.table_id
ORDER BY o.order_date DESC;

-- Order Details View (with products and menus)
CREATE OR REPLACE VIEW order_details_view AS
SELECT
    o.order_id,o.customer_id,
    o.table_id,o.order_type,
    o.status, o.subtotal,
    o.tax_amount, o.discount_amount,
    o.service_charge, o.total_amount,
    o.payment_status, o.completed_at,
    o.order_date,o.server_id,
    o.updated_at,o.updated_by,
    -- Customer information
    c.name AS customer_name,
    c.phone_number AS customer_phone,
    c.email AS customer_email,
    -- Server information
    u.user_name AS server_name,
    u.phone AS server_phone,
    -- Table information
    t.capacity AS table_capacity,
    t.section_code AS table_section,
    -- Order products (as JSON array)
    COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                     'order_item_id', op.order_item_id,
                    'product_id', op.product_id,
                    'quantity', op.quantity,
                    'unit_price', op.unit_price,
                    'total_price', op.total_price,
                    'status', op.status,
                    'created_at', op.created_at,
                    'product_name', p.name,
                    'description', p.description,
                    'image_url', p.image_url,
                    'preparation_time', p.preparation_time
                )
            )
            FROM order_products op
            LEFT JOIN products p ON op.product_id = p.product_id
            WHERE op.order_id = o.order_id
        ),
        '[]'::json
    ) AS products,
    
    -- Order menus (as JSON array)
    COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'order_menu_id', om.order_menu_id,
                    'menu_id', om.menu_id,
                    'quantity', om.quantity,
                    'unit_price', om.unit_price,
                    'total_price', om.total_price,
                    'status', om.status,
                    'created_at', om.created_at,
                    'menu_name', m.menu_name,
                    'description', m.description,
                    'image_url', m.image_url,
                    'preparation_time', m.preparation_time
                )
            )
            FROM order_menus om
            LEFT JOIN menus m ON om.menu_id = m.menu_id
            WHERE om.order_id = o.order_id
        ),
        '[]'::json
    ) AS menus,
    
    -- Product counts
    (
        SELECT COUNT(*) 
        FROM order_products op 
        WHERE op.order_id = o.order_id
    ) AS product_count,
    (
        SELECT COUNT(*) 
        FROM order_menus om 
        WHERE om.order_id = o.order_id
    ) AS menu_count,
    -- Total items
    (
        SELECT COUNT(*) 
        FROM order_products op 
        WHERE op.order_id = o.order_id
    ) + (
        SELECT COUNT(*) 
        FROM order_menus om 
        WHERE om.order_id = o.order_id
    ) AS total_items
    
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN users u ON o.server_id = u.user_id
LEFT JOIN tables t ON o.table_id = t.table_id
ORDER BY o.order_date DESC;

-- Order Products View (detailed product information)
CREATE OR REPLACE VIEW order_products_view AS
SELECT
    op.*,
    
    -- Product information
    p.name AS product_name,
    p.description AS product_description,
    p.preparation_time AS product_preparation_time
    
FROM order_products op
LEFT JOIN products p ON op.product_id = p.product_id
ORDER BY op.created_at ASC;

-- Order Menus View (detailed menu information)
CREATE OR REPLACE VIEW order_menus_view AS
SELECT
    om.*,
    
    -- Menu information
    m.menu_name,
    m.description AS menu_description,
    m.preparation_time AS menu_preparation_time
    
FROM order_menus om
LEFT JOIN menus m ON om.menu_id = m.menu_id
ORDER BY om.created_at ASC;


