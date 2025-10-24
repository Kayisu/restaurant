-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories CASCADE;
DROP TRIGGER IF EXISTS update_subcategories_updated_at ON subcategories CASCADE;
DROP TRIGGER IF EXISTS update_products_updated_at ON products CASCADE;
DROP TRIGGER IF EXISTS update_menus_updated_at ON menus CASCADE;
DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers CASCADE;
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations CASCADE;
DROP TRIGGER IF EXISTS update_discounts_updated_at ON discounts CASCADE;
DROP TRIGGER IF EXISTS update_tables_updated_at ON tables CASCADE;
DROP TRIGGER IF EXISTS update_bills_updated_at ON bills CASCADE;
DROP TRIGGER IF EXISTS update_token_blacklist_updated_at ON token_blacklist CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_tokens() CASCADE;

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to cleanup expired tokens (for token blacklist)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM token_blacklist WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at column
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_blacklist_updated_at BEFORE UPDATE ON token_blacklist 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


