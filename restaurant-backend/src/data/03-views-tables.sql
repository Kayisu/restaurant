-- Drop existing views
DROP VIEW IF EXISTS dashboard_tables CASCADE;
DROP VIEW IF EXISTS table_details CASCADE;
DROP VIEW IF EXISTS dashboard_stats CASCADE;
DROP VIEW IF EXISTS table_sections CASCADE;
DROP VIEW IF EXISTS dashboard_section_summary CASCADE;

-- Dashboard Tables View
CREATE VIEW dashboard_tables AS
SELECT 
  t.table_id,
  t.capacity,
  t.section_code,
  t.is_occupied,
  t.occupied_since,
  t.current_customer_id,
  
  -- Server information if assigned
  u.user_name as server_name,

  -- Reservation information 
  r.reservation_id,
  r.party_size as reserved_party_size,
  r.reservation_date,
  r.reservation_time,
  r.status as reservation_status,

  -- Enhanced table status summary (string) 
  CASE 
    WHEN t.is_occupied = true AND o.status = 'pending' THEN 'ordering'
    WHEN t.is_occupied = true AND o.status = 'confirmed' THEN 'preparing'
    WHEN t.is_occupied = true AND o.status = 'preparing' THEN 'preparing'
    WHEN t.is_occupied = true AND o.status = 'ready' THEN 'ready'
    WHEN t.is_occupied = true AND o.status = 'served' THEN 'served'
    WHEN t.is_occupied = false AND r.reservation_id IS NOT NULL THEN 'reserved'
    ELSE 'available'
  END as table_status,
  
  -- Table usage duration in minutes (numeric) 
  CASE
    WHEN t.is_occupied = true AND t.occupied_since IS NOT NULL
    THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.occupied_since))/60
    ELSE 0
  END as occupied_duration_minutes,
  
  -- Table usage duration (formatted string) 
  CASE
    WHEN t.is_occupied = true AND t.occupied_since IS NOT NULL THEN
      CASE
        WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.occupied_since))/60 < 60 THEN
          ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.occupied_since))/60) || ' min'
        ELSE
          ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.occupied_since))/3600, 1) || ' hrs'
      END
    ELSE '0 min'
  END as occupied_duration_formatted,

  -- Active order total amount 
  o.total_amount,

  -- Active order ID 
  o.order_id as active_order_id

FROM tables t
LEFT JOIN users u ON t.assigned_server = u.user_id
LEFT JOIN orders o ON t.table_id = o.table_id 
  AND o.status NOT IN ('completed', 'cancelled', 'closed')
  AND o.customer_id = t.current_customer_id
  AND o.order_date = (
    SELECT MAX(order_date) 
    FROM orders o2 
    WHERE o2.table_id = t.table_id 
    AND o2.status NOT IN ('completed', 'cancelled', 'closed')
    AND o2.customer_id = t.current_customer_id
  )
LEFT JOIN reservations r ON t.table_id = r.table_id 
  AND r.reservation_date = CURRENT_DATE
  AND r.status = 'confirmed'
ORDER BY 
  CASE 
    WHEN t.is_occupied = false THEN 0
    ELSE 1
  END,
  t.table_id;

-- Table Details View (Comprehensive table information)
CREATE VIEW table_details AS
SELECT
  t.table_id,
  t.capacity,
  t.section_code,
  t.is_occupied,
  t.assigned_server,
  t.occupied_since,
  t.current_customer_id,
  t.created_at,
  t.updated_at,

  -- Server (staff) information if assigned
  u.user_name as server_name,
  u.phone as server_phone,

  -- Active order information
  o.order_id as active_order_id,
  o.status as order_status,
  o.order_date,
  o.total_amount,
  o.customer_id,

  -- Current customer information (from current_customer_id)
  CASE 
    WHEN t.current_customer_id IS NULL THEN NULL
    ELSE cc.name
  END as current_customer_name,
  CASE 
    WHEN t.current_customer_id IS NULL THEN NULL
    ELSE cc.phone_number
  END as current_customer_phone,

  -- Order customer information (from order)
  c.name as order_customer_name,
  c.phone_number as order_customer_phone,

  -- Reservation information
  r.reservation_id,
  r.party_size as reserved_party_size,
  r.reservation_date,
  r.reservation_time,
  r.status as reservation_status,
  rc.name as reserved_customer_name,
  rc.phone_number as reserved_customer_phone,

  -- Enhanced table status summary
  CASE
    WHEN EXISTS (
      SELECT 1 FROM reservations r 
      WHERE r.table_id = t.table_id 
      AND r.reservation_date = CURRENT_DATE 
      AND r.status = 'confirmed'
    ) THEN 'reserved'
    WHEN t.is_occupied = false THEN 'available'
    WHEN t.is_occupied = true AND o.status = 'pending' THEN 'ordering'
    WHEN t.is_occupied = true AND o.status = 'confirmed' THEN 'confirmed'
    WHEN t.is_occupied = true AND o.status = 'preparing' THEN 'preparing'
    WHEN t.is_occupied = true AND o.status = 'ready' THEN 'ready'
    WHEN t.is_occupied = true AND o.status = 'served' THEN 'served'
    WHEN t.is_occupied = true AND o.status = 'completed' THEN 'payment_pending'
    ELSE 'occupied'
  END as table_status,

  -- Table usage duration in minutes (numeric)
  CASE
    WHEN t.is_occupied = true AND t.occupied_since IS NOT NULL
    THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.occupied_since))/60
    ELSE 0
  END as occupied_duration_minutes,

  -- Table usage duration (formatted string)
  CASE
    WHEN t.is_occupied = true AND t.occupied_since IS NOT NULL THEN
      CASE
        WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.occupied_since))/60 < 60 THEN
          ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.occupied_since))/60) || ' min'
        ELSE
          ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.occupied_since))/3600, 1) || ' hrs'
      END
    ELSE '0 min'
  END as occupied_duration_formatted,

  -- Order item count
  COALESCE(oi.item_count, 0) as order_item_count,

  -- Last activity timestamp
  GREATEST(t.occupied_since, o.order_date) as last_activity

FROM tables t
LEFT JOIN users u ON t.assigned_server = u.user_id
LEFT JOIN orders o ON t.table_id = o.table_id
  AND o.status NOT IN ('completed', 'cancelled', 'closed')
  AND o.customer_id = t.current_customer_id
  AND o.order_date = (
    SELECT MAX(order_date)
    FROM orders o2
    WHERE o2.table_id = t.table_id
    AND o2.status NOT IN ('completed', 'cancelled', 'closed')
    AND o2.customer_id = t.current_customer_id
  )
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN customers cc ON t.current_customer_id = cc.customer_id
LEFT JOIN reservations r ON t.table_id = r.table_id
  AND r.reservation_date = CURRENT_DATE
  AND r.status = 'confirmed'
LEFT JOIN customers rc ON r.customer_id = rc.customer_id
LEFT JOIN (
  SELECT
    order_id,
    COUNT(*) as item_count
  FROM (
    SELECT order_id FROM order_products WHERE status != 'cancelled'
    UNION ALL
    SELECT order_id FROM order_menus WHERE status != 'cancelled'
  ) combined_items
  GROUP BY order_id
) oi ON o.order_id = oi.order_id
ORDER BY
  CASE
    WHEN EXISTS (
      SELECT 1 FROM reservations r 
      WHERE r.table_id = t.table_id 
      AND r.reservation_date = CURRENT_DATE 
      AND r.status = 'confirmed'
    ) THEN 1
    WHEN t.is_occupied = false THEN 0
    ELSE 2
  END,
  t.table_id;

-- Dashboard Statistics View 
CREATE VIEW dashboard_stats AS
SELECT 
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE t.is_occupied = true) as occupied_tables,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.table_id = t.table_id 
    AND r.reservation_date = CURRENT_DATE 
    AND r.status = 'confirmed'
  )) as reserved_tables,
  COUNT(*) FILTER (WHERE t.is_occupied = false AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.table_id = t.table_id 
    AND r.reservation_date = CURRENT_DATE 
    AND r.status = 'confirmed'
  )) as available_tables,
  COUNT(*) FILTER (WHERE dt.table_status = 'ordering') as ordering_tables,
  COUNT(*) FILTER (WHERE dt.table_status = 'preparing') as preparing_tables,
  COUNT(*) FILTER (WHERE dt.table_status = 'ready') as ready_tables,
  COUNT(*) FILTER (WHERE dt.table_status = 'served') as served_tables,
  ROUND(AVG(dt.occupied_duration_minutes)) as avg_occupation_time,
  SUM(COALESCE(dt.total_amount, 0)) as active_orders_total
FROM tables t
LEFT JOIN dashboard_tables dt ON t.table_id = dt.table_id;

-- Table Sections View
CREATE VIEW table_sections AS
SELECT 
  LEFT(t.table_id, 1) AS section_code,
  COUNT(*) AS total_tables,
  COUNT(*) FILTER (WHERE t.is_occupied = true) AS occupied_tables,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.table_id = t.table_id 
    AND r.reservation_date = CURRENT_DATE 
    AND r.status = 'confirmed'
  )) AS reserved_tables,
  COUNT(*) FILTER (WHERE t.is_occupied = false AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.table_id = t.table_id 
    AND r.reservation_date = CURRENT_DATE 
    AND r.status = 'confirmed'
  )) AS available_tables,
  SUM(t.capacity) AS total_capacity,
  SUM(t.capacity) FILTER (WHERE t.is_occupied = false AND NOT EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.table_id = t.table_id 
    AND r.reservation_date = CURRENT_DATE 
    AND r.status = 'confirmed'
  )) AS available_capacity,
  ROUND(((COUNT(*) FILTER (WHERE t.is_occupied = true) + COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.table_id = t.table_id 
    AND r.reservation_date = CURRENT_DATE 
    AND r.status = 'confirmed'
  )))::numeric * 100.0) / COUNT(*)::numeric, 1) AS occupancy_rate,
  ROUND(AVG(t.capacity), 1) AS avg_capacity,
  ROUND(AVG(dt.occupied_duration_minutes) FILTER (WHERE t.is_occupied = true), 1) AS avg_occupied_time,
  COUNT(*) FILTER (WHERE dt.active_order_id IS NOT NULL) AS tables_with_orders,
  SUM(COALESCE(dt.total_amount, 0)) AS section_revenue
FROM tables t
LEFT JOIN dashboard_tables dt ON t.table_id = dt.table_id
GROUP BY LEFT(t.table_id, 1)
ORDER BY LEFT(t.table_id, 1);

-- Dashboard Section Summary View
CREATE VIEW dashboard_section_summary AS
SELECT 
  section_code,
  total_tables,
  occupied_tables,
  available_tables,
  reserved_tables,
  occupancy_rate,
  CASE
    WHEN occupancy_rate >= 90 THEN 'full'
    WHEN occupancy_rate >= 70 THEN 'busy'
    WHEN occupancy_rate >= 40 THEN 'moderate'
    ELSE 'quiet'
  END AS section_status
FROM table_sections
ORDER BY section_code;
