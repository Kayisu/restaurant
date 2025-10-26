export interface Order {
  order_id: number;
  table_id: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' | 'closed';
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  order_date: string;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  items: OrderItem[];
  server_id?: number;
  server_name?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id?: string;
  menu_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_menu_item: boolean;
  created_at: string;
}

export interface OrderFilters {
  status?: string;
  order_type?: string;
  table_id?: string;
  customer_name?: string;
  date_from?: string;
  date_to?: string;
  server_id?: number;
}

export interface OrderStats {
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  pending_orders: number;
  preparing_orders: number;
  ready_orders: number;
  total_revenue: number;
  average_order_value: number;
}
