-- 1. ROLES TABLE
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. USERS TABLE
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  user_name VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(role_id),
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 4. CUSTOMERS TABLE (Simplified - Single customer type)
CREATE TABLE customers (
  customer_id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  address TEXT,
  date_of_birth DATE,
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  last_visit TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLES TABLE 
CREATE TABLE tables (
  table_id VARCHAR(10) PRIMARY KEY,
  capacity INTEGER NOT NULL,
  section_code VARCHAR(10),
  is_occupied BOOLEAN DEFAULT false,
  occupied_since TIMESTAMP,
  current_customer_id INTEGER REFERENCES customers(customer_id) DEFAULT NULL,
  assigned_server INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. CATEGORIES TABLE 
CREATE TABLE categories (
  category_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(user_id),
  updated_by INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. SUBCATEGORIES TABLE 
CREATE TABLE subcategories (
  subcategory_id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(user_id),
  updated_by INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. PRODUCTS TABLE 
CREATE TABLE products (
  product_id VARCHAR(20) PRIMARY KEY,
  subcategory_id INTEGER NOT NULL REFERENCES subcategories(subcategory_id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  preparation_time INTEGER,
  created_by INTEGER REFERENCES users(user_id),
  updated_by INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. MENUS TABLE 
CREATE TABLE menus (
  menu_id SERIAL PRIMARY KEY,
  menu_name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  preparation_time INTEGER,
  created_by INTEGER REFERENCES users(user_id),
  updated_by INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. MENU ITEMS JUNCTION TABLE 
CREATE TABLE menu_items (
  menu_item_id SERIAL PRIMARY KEY,
  menu_id INTEGER NOT NULL REFERENCES menus(menu_id) ON DELETE CASCADE,
  product_id VARCHAR(20) NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN DEFAULT true,
  item_type VARCHAR(20) DEFAULT 'main',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(menu_id, product_id)
);

-- 11. ORDERS TABLE 
CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(customer_id),
  table_id VARCHAR(10) REFERENCES tables(table_id),
  order_type VARCHAR(20) DEFAULT 'dine_in',
  status VARCHAR(20) DEFAULT 'pending',
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  service_charge DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  payment_status VARCHAR(20) DEFAULT 'pending',
  completed_at TIMESTAMP,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Server relationships 
  server_id INTEGER REFERENCES users(user_id),
  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(user_id)
);

-- 12. ORDER PRODUCTS TABLE 
CREATE TABLE order_products (
  order_product_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id VARCHAR(20) NOT NULL REFERENCES products(product_id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. ORDER MENUS TABLE 
CREATE TABLE order_menus (
  order_menu_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  menu_id INTEGER NOT NULL REFERENCES menus(menu_id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. BILLS TABLE
CREATE TABLE bills (
  bill_id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(order_id),
  customer_id INTEGER REFERENCES customers(customer_id),
  bill_number VARCHAR(20) UNIQUE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  service_charge DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  server_id INTEGER REFERENCES users(user_id),
  issued_by INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. BILL PRODUCTS TABLE 
CREATE TABLE bill_products (
  bill_product_id SERIAL PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(bill_id) ON DELETE CASCADE,
  product_id VARCHAR(20) REFERENCES products(product_id),
  menu_id INTEGER REFERENCES menus(menu_id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  is_menu_item BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_bill_product_or_menu CHECK (
    (product_id IS NOT NULL AND menu_id IS NULL AND is_menu_item = false) OR
    (product_id IS NULL AND menu_id IS NOT NULL AND is_menu_item = true)
  )
);

-- 16. RESERVATIONS TABLE 
CREATE TABLE reservations (
  reservation_id SERIAL PRIMARY KEY,
  
  -- Customer reference (simple customer_id)
  customer_id INTEGER REFERENCES customers(customer_id),
  
  -- Table reference
  table_id VARCHAR(10) NOT NULL REFERENCES tables(table_id),
  
  -- Reservation details
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  
  -- Date and time
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  
  -- Status and duration
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show', 'overdue')),
  duration_hours INTEGER DEFAULT 2 CHECK (duration_hours BETWEEN 1 AND 6),
  
  -- Additional information
  notes TEXT,
  
  -- System fields
  created_by INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT check_reservation_date CHECK (
    reservation_date >= CURRENT_DATE
  ),
  
  CONSTRAINT check_reservation_time CHECK (
    reservation_time >= '06:00:00' AND reservation_time <= '23:00:00'
  )
);

-- 17. TOKEN BLACKLIST TABLE
CREATE TABLE token_blacklist (
  id SERIAL PRIMARY KEY,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  reason VARCHAR(100) DEFAULT 'user_update'
);

-- CONSTRAINTS FOR ID FORMAT VALIDATION
ALTER TABLE products ADD CONSTRAINT check_product_id_format 
CHECK (product_id ~ '^[0-9]+\.[0-9]+\.[0-9]+$');

-- BUSINESS CONSTRAINTS
-- Products business constraints
ALTER TABLE products ADD CONSTRAINT check_product_price CHECK (price > 0);
ALTER TABLE products ADD CONSTRAINT check_preparation_time CHECK (preparation_time > 0);

-- Menus business constraints
ALTER TABLE menus ADD CONSTRAINT check_menu_price CHECK (price > 0);
ALTER TABLE menus ADD CONSTRAINT check_menu_preparation_time CHECK (preparation_time > 0);

-- Menu items business constraints
ALTER TABLE menu_items ADD CONSTRAINT check_menu_item_quantity CHECK (quantity > 0);
ALTER TABLE menu_items ADD CONSTRAINT check_menu_item_type CHECK (item_type IN ('starter', 'main', 'side', 'drink', 'dessert'));

-- Product options business constraints
ALTER TABLE product_options ADD CONSTRAINT check_product_option_price_modifier CHECK (price_modifier >= -1000.00);
ALTER TABLE product_options ADD CONSTRAINT check_product_option_type CHECK (option_type IN ('size', 'spice_level', 'cooking_method', 'add_ons', 'customization'));

-- Order items business constraints
ALTER TABLE order_products ADD CONSTRAINT check_order_product_quantity CHECK (quantity > 0);
ALTER TABLE order_products ADD CONSTRAINT check_order_product_unit_price CHECK (unit_price >= 0);
ALTER TABLE order_products ADD CONSTRAINT check_order_product_total_price CHECK (total_price >= 0);
ALTER TABLE order_products ADD CONSTRAINT check_order_product_status CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'));

ALTER TABLE order_menus ADD CONSTRAINT check_order_menu_quantity CHECK (quantity > 0);
ALTER TABLE order_menus ADD CONSTRAINT check_order_menu_unit_price CHECK (unit_price >= 0);
ALTER TABLE order_menus ADD CONSTRAINT check_order_menu_total_price CHECK (total_price >= 0);
ALTER TABLE order_menus ADD CONSTRAINT check_order_menu_status CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'));

-- Orders business constraints
ALTER TABLE orders ADD CONSTRAINT check_order_subtotal CHECK (subtotal >= 0);
ALTER TABLE orders ADD CONSTRAINT check_order_tax CHECK (tax_amount >= 0);
ALTER TABLE orders ADD CONSTRAINT check_order_service_charge CHECK (service_charge >= 0);
ALTER TABLE orders ADD CONSTRAINT check_order_total CHECK (total_amount >= 0);
ALTER TABLE orders ADD CONSTRAINT check_order_status CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled', 'closed'));
ALTER TABLE orders ADD CONSTRAINT check_order_payment_status CHECK (payment_status IN ('pending', 'completed', 'cancelled', 'refunded'));

-- Bills business constraints
ALTER TABLE bills ADD CONSTRAINT check_bill_subtotal CHECK (subtotal >= 0);
ALTER TABLE bills ADD CONSTRAINT check_bill_tax CHECK (tax_amount >= 0);
ALTER TABLE bills ADD CONSTRAINT check_bill_discount CHECK (discount_amount >= 0);
ALTER TABLE bills ADD CONSTRAINT check_bill_service_charge CHECK (service_charge >= 0);
ALTER TABLE bills ADD CONSTRAINT check_bill_total CHECK (total_amount >= 0);
ALTER TABLE bills ADD CONSTRAINT check_bill_payment_status CHECK (payment_status IN ('pending', 'completed', 'cancelled', 'refunded'));

-- Bill products business constraints
ALTER TABLE bill_products ADD CONSTRAINT check_bill_product_quantity CHECK (quantity > 0);
ALTER TABLE bill_products ADD CONSTRAINT check_bill_product_unit_price CHECK (unit_price >= 0);
ALTER TABLE bill_products ADD CONSTRAINT check_bill_product_total_price CHECK (total_price >= 0);
ALTER TABLE bill_products ADD CONSTRAINT check_bill_product_discount CHECK (discount_amount >= 0);

-- Tables business constraints
ALTER TABLE tables ADD CONSTRAINT check_table_capacity CHECK (capacity > 0 AND capacity <= 20);
ALTER TABLE tables ADD CONSTRAINT check_table_id_format CHECK (table_id ~ '^[A-Z]-[0-9]{2}$');

-- Reservations business constraints
ALTER TABLE reservations ADD CONSTRAINT check_reservation_party_size CHECK (party_size > 0);
ALTER TABLE reservations ADD CONSTRAINT check_reservation_duration CHECK (duration_hours BETWEEN 1 AND 6);
ALTER TABLE reservations ADD CONSTRAINT check_reservation_status CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show', 'overdue'));

-- Users business constraints
ALTER TABLE users ADD CONSTRAINT check_user_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE users ADD CONSTRAINT check_user_phone CHECK (phone ~ '^[0-9+\-\s()]+$');

-- Token blacklist business constraints
ALTER TABLE token_blacklist ADD CONSTRAINT check_token_blacklist_expires CHECK (expires_at > created_at);
ALTER TABLE token_blacklist ADD CONSTRAINT check_token_blacklist_reason CHECK (reason IN ('user_update', 'logout', 'password_change', 'account_deactivation', 'security_breach'));
ALTER TABLE token_blacklist ADD CONSTRAINT check_token_blacklist_updated CHECK (updated_at >= created_at);

-- Customers business constraints
ALTER TABLE customers ADD CONSTRAINT check_customer_spent CHECK (total_spent >= 0);
ALTER TABLE customers ADD CONSTRAINT check_customer_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);
ALTER TABLE customers ADD CONSTRAINT check_customer_phone CHECK (phone_number ~ '^[0-9+\-\s()]+$');


-- INDEXES
-- User indexes
CREATE INDEX idx_user_name ON users(user_name);
CREATE INDEX idx_user_role ON users(role_id);

-- Customer indexes
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_customers_email ON customers(email);

-- Table indexes
CREATE INDEX idx_tables_occupied ON tables(is_occupied);
CREATE INDEX idx_tables_current_customer ON tables(current_customer_id);
CREATE INDEX idx_tables_section ON tables(section_code);

-- Order indexes
CREATE INDEX idx_orders_server ON orders(server_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Product indexes
CREATE INDEX idx_products_subcategory ON products(subcategory_id);
CREATE INDEX idx_products_available ON products(is_available);

-- Category indexes
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);

-- Menu indexes
CREATE INDEX idx_menus_category ON menus(category_id);
CREATE INDEX idx_menus_available ON menus(is_available);
CREATE INDEX idx_menu_items_menu ON menu_items(menu_id);
CREATE INDEX idx_menu_items_product ON menu_items(product_id);

-- Order item indexes
CREATE INDEX idx_order_products_order ON order_products(order_id);
CREATE INDEX idx_order_products_product ON order_products(product_id);
CREATE INDEX idx_order_products_status ON order_products(status);
CREATE INDEX idx_order_menus_order ON order_menus(order_id);
CREATE INDEX idx_order_menus_menu ON order_menus(menu_id);
CREATE INDEX idx_order_menus_status ON order_menus(status);

-- Discount indexes
CREATE INDEX idx_discounts_code ON discounts(discount_code);
CREATE INDEX idx_discounts_active ON discounts(is_active);
CREATE INDEX idx_discounts_validity ON discounts(valid_from, valid_until);

-- System log indexes
CREATE INDEX idx_system_logs_user ON system_logs(user_id);
CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_table ON system_logs(table_name);
CREATE INDEX idx_system_logs_date ON system_logs(created_at);

-- User shift indexes
CREATE INDEX idx_user_shifts_user ON user_shifts(user_id);
CREATE INDEX idx_user_shifts_active ON user_shifts(is_active);
CREATE INDEX idx_user_shifts_date ON user_shifts(shift_start);

-- Token blacklist indexes
CREATE INDEX idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX idx_token_blacklist_user ON token_blacklist(user_id);
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX idx_token_blacklist_updated ON token_blacklist(updated_at);

-- Bill indexes
CREATE INDEX idx_bills_server ON bills(server_id);
CREATE INDEX idx_bills_customer ON bills(customer_id);
CREATE INDEX idx_bills_order ON bills(order_id);
CREATE INDEX idx_bills_payment_status ON bills(payment_status);
CREATE INDEX idx_bills_bill_date ON bills(bill_date);
CREATE INDEX idx_payments_processed_by ON payments(processed_by);

-- Reservation indexes
CREATE INDEX idx_reservations_table ON reservations(table_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_customer ON reservations(customer_id);
CREATE INDEX idx_reservations_status ON reservations(status);

-- COMPOSITE INDEXES
-- Reservation composite indexes for common queries
CREATE INDEX idx_reservations_table_date_time ON reservations (table_id, reservation_date, reservation_time);
CREATE INDEX idx_reservations_date_status ON reservations (reservation_date, status);
CREATE INDEX idx_reservations_customer_date ON reservations (customer_id, reservation_date);

-- Order composite indexes
CREATE INDEX idx_orders_table_status ON orders (table_id, status);
CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date);
CREATE INDEX idx_orders_status_date ON orders (status, order_date);
CREATE INDEX idx_orders_server_status ON orders (server_id, status);

-- Bill composite indexes
CREATE INDEX idx_bills_order_payment ON bills (order_id, payment_status);
CREATE INDEX idx_bills_customer_date ON bills (customer_id, bill_date);
CREATE INDEX idx_bills_date_payment ON bills (bill_date, payment_status);
CREATE INDEX idx_bills_server_status ON bills (server_id, payment_status);

-- Product composite indexes
CREATE INDEX idx_products_category_available ON products (subcategory_id, is_available);

-- Menu composite indexes
CREATE INDEX idx_menus_category_available ON menus (category_id, is_available);
CREATE INDEX idx_menu_items_menu_product ON menu_items (menu_id, product_id);

-- Order item composite indexes
CREATE INDEX idx_order_products_order_product ON order_products (order_id, product_id);
CREATE INDEX idx_order_menus_order_menu ON order_menus (order_id, menu_id);

-- Bill composite indexes
CREATE INDEX idx_bill_products_bill_product ON bill_products (bill_id, product_id);
CREATE INDEX idx_bill_products_bill_menu ON bill_products (bill_id, menu_id);
CREATE INDEX idx_bill_products_is_menu_item ON bill_products (is_menu_item);

-- Token blacklist composite indexes
CREATE INDEX idx_token_blacklist_user_expires ON token_blacklist (user_id, expires_at);
CREATE INDEX idx_token_blacklist_reason_expires ON token_blacklist (reason, expires_at);
CREATE INDEX idx_token_blacklist_user_updated ON token_blacklist (user_id, updated_at);
