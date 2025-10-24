export interface Table {
  id: string;
  table_id: string; // For backward compatibility
  table_number: string;
  section_code: string;
  capacity: number;
  is_occupied: boolean;
  is_reserved?: boolean;
  table_status: string; // For backward compatibility
  occupied_duration_minutes?: number;
  order_item_count?: number;
  total_amount?: number;
  customer_name?: string;
  customer_phone?: string;
  reservation_id?: string;
  reserved_party_size?: number;
  reservation_date?: string;
  reservation_time?: string;
  reservation_status?: string;
  reserved_customer_name?: string;
  reserved_customer_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface TableSection {
  section_code: string;
  name: string;
  description?: string;
  total_tables: number;
  occupied_tables: number;
  available_tables: number;
  reserved_tables: number;
}

export interface TableStatus {
  is_occupied: boolean;
  is_reserved: boolean;
  table_status?: 'available' | 'occupied' | 'reserved' | 'cleaning';
}

export interface DashboardStats {
  total_tables: number;
  occupied_tables: number;
  available_tables: number;
  reserved_tables: number;
  total_orders: number;
  active_orders: number;
  revenue_today: number;
  total_revenue: number; // For backward compatibility
}

export interface SectionSummary {
  section_code: string;
  section_name: string;
  total_tables: number;
  occupied_tables: number;
  available_tables: number;
}

export interface RestaurantOrder {
  order_id: number;
  table_id: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  server_id?: number;
  server_name?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' | 'closed';
  order_date: string;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  items: RestaurantOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface RestaurantOrderItem {
  order_item_id: number;
  product_id?: number;
  menu_id?: number;
  item_name: string;
  item_description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  status: string;
  assigned_chef?: string;
  created_at: string;
}

export interface CreateOrderRequest {
  items: {
    product_id: string;
    quantity: number;
    notes?: string;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Customer interfaces
export interface Customer {
  customer_id: number;
  name: string;
  phone_number: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  loyalty_points?: number;
  total_spent?: number;
  last_visit?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone_number: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  loyalty_points?: number;
  total_spent?: number;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  loyalty_points?: number;
  total_spent?: number;
}

// Reservation interfaces
export interface Reservation {
  reservation_id: number;
  customer_id?: number;
  table_id: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'overdue';
  reservation_status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'overdue';
  created_by: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  notes?: string;
  formatted_date?: string;
  formatted_time?: string;
}

export interface CreateReservationRequest {
  table_id: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'overdue';
  notes?: string;
}

export interface UpdateReservationRequest {
  table_id?: string;
  party_size?: number;
  reservation_date?: string;
  reservation_time?: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'overdue';
  notes?: string;
}

export interface ReservationStats {
  total_reservations: number;
  confirmed_reservations: number;
  cancelled_reservations: number;
  today_reservations: number;
  tomorrow_reservations: number;
  avg_party_size: number;
}

export interface CustomerStats {
  total_customers: number;
  guest_customers: number;
  registered_customers: number;
  avg_loyalty_points: number;
  total_revenue: number;
  active_customers_30d: number;
}
