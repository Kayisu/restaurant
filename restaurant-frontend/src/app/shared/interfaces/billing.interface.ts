// Billing Interfaces

export interface Bill {
  bill_id: number;
  order_id?: number;
  customer_id?: number;
  bill_number: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  service_charge: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  bill_status?: 'pending' | 'completed' | 'cancelled';
  due_date?: string;
  server_id?: number;
  issued_by?: number;
  created_at: string;
  updated_at: string;
  bill_date: string;
  
  // Joined fields
  customer_name?: string;
  customer_phone?: string;
  server_name?: string;
  issued_by_name?: string;
  table_id?: string;
  order_status?: string;
  
  // Products (when loaded with products)
  products?: BillProduct[];
}

export interface BillProduct {
  bill_product_id: number;
  bill_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  created_at: string;
  
  // Joined fields
  product_name?: string;
  description?: string;
  image_url?: string;
}

export interface CreateBillRequest {
  order_id?: number;
  customer_id?: number;
  bill_number?: string;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  service_charge?: number;
  total_amount: number;
  status?: 'pending' | 'completed' | 'cancelled';
  payment_status?: 'pending' | 'paid' | 'cancelled' | 'refunded';
  due_date?: string;
  server_id?: number;
  issued_by?: number;
}

export interface UpdateBillRequest {
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  service_charge?: number;
  total_amount?: number;
  status?: 'pending' | 'completed' | 'cancelled';
  payment_status?: 'pending' | 'paid' | 'cancelled' | 'refunded';
  due_date?: string;
}

export interface AddBillProductRequest {
  product_id: string; // Changed to string to match backend format
  quantity?: number;
  unit_price: number;
  total_price: number;
  discount_amount?: number;
}

export interface UpdateBillProductRequest {
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  discount_amount?: number;
}

export interface AddBillMenuRequest {
  menu_id: string; // Changed to string to match backend format
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount?: number;
}

export interface BillResponse {
  success: boolean;
  message: string;
  data: Bill | Bill[];
  error?: string;
}

export interface BillNumberResponse {
  success: boolean;
  message: string;
  data: {
    bill_number: string;
  };
  error?: string;
}

