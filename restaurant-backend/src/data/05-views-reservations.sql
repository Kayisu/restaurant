-- Drop existing views
DROP VIEW IF EXISTS reservation_customer_summary_view CASCADE;
DROP VIEW IF EXISTS today_reservations CASCADE;
DROP VIEW IF EXISTS reservation_stats CASCADE;

-- Reservation Customer Summary View
CREATE OR REPLACE VIEW reservation_customer_summary_view AS
SELECT
    -- Reservation Information
    r.reservation_id,
    r.status AS reservation_status,
    r.party_size,
    r.duration_hours,
    r.notes AS reservation_notes,
    
    -- Table Information
    r.table_id,
    t.capacity AS table_capacity,
    t.section_code AS table_section,
    
    -- Date & Time Information (String format to avoid timezone issues)
    r.reservation_date::text AS reservation_date,
    r.reservation_time::text AS reservation_time,
    -- Formatted for display (DD/MM/YYYY, HH:MM)
    TO_CHAR(r.reservation_date, 'DD/MM/YYYY') AS formatted_date,
    TO_CHAR(r.reservation_time, 'HH24:MI') AS formatted_time,
    
    -- Creation Information
    r.created_at AS reservation_created_at,
    TO_CHAR(r.created_at, 'DD/MM/YYYY HH24:MI') AS formatted_created_at,
    r.updated_at AS reservation_updated_at,
    
    -- Customer Information
    c.customer_id,
    c.name AS customer_name,
    c.phone_number AS customer_phone,
    c.email AS customer_email,
    c.address AS customer_address,
    c.loyalty_points,
    c.total_spent,
    c.last_visit,
    c.created_at AS customer_registration_date,
    TO_CHAR(c.created_at, 'DD/MM/YYYY HH24:MI') AS formatted_customer_registration,
    
    -- Staff Information
    u.user_name AS created_by_name,
    u.email AS created_by_email
    
FROM reservations r
LEFT JOIN customers c ON r.customer_id = c.customer_id
LEFT JOIN tables t ON r.table_id = t.table_id
LEFT JOIN users u ON r.created_by = u.user_id
ORDER BY r.reservation_date DESC, r.reservation_time ASC;

-- Today's Reservations View
CREATE OR REPLACE VIEW today_reservations AS
SELECT
    r.reservation_id,
    r.customer_id,
    r.table_id,
    r.reservation_date,
    r.reservation_time,
    r.party_size,
    r.status,
    r.duration_hours,
    r.notes,
    r.created_by,
    c.name AS customer_name,
    c.phone_number AS customer_phone,
    c.email AS customer_email,
    t.capacity AS table_capacity,
    t.section_code AS table_section,
    u.user_name AS created_by_name
FROM reservations r
LEFT JOIN customers c ON r.customer_id = c.customer_id
LEFT JOIN tables t ON r.table_id = t.table_id
LEFT JOIN users u ON r.created_by = u.user_id
WHERE r.reservation_date = CURRENT_DATE
ORDER BY r.reservation_time ASC;

-- Reservation Statistics View
CREATE OR REPLACE VIEW reservation_stats AS
SELECT
    -- Total counts
    COUNT(*) AS total_reservations,
    COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_reservations,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_reservations,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_reservations,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_reservations,
    COUNT(*) FILTER (WHERE status = 'no_show') AS no_show_reservations,
    COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_reservations,
    
    -- Today's counts
    COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE) AS today_reservations,
    COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE AND status = 'confirmed') AS today_confirmed,
    COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE AND status = 'pending') AS today_pending,
    
    -- Average party size
    ROUND(AVG(party_size), 1) AS avg_party_size,
    
    -- Completion rate
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::numeric / 
         NULLIF(COUNT(*) FILTER (WHERE status IN ('confirmed', 'completed', 'cancelled', 'no_show')), 0) * 100), 
        1
    ) AS completion_rate,
    
    -- No-show rate
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'no_show')::numeric / 
         NULLIF(COUNT(*) FILTER (WHERE status IN ('confirmed', 'completed', 'cancelled', 'no_show')), 0) * 100), 
        1
    ) AS no_show_rate
    
FROM reservations;


