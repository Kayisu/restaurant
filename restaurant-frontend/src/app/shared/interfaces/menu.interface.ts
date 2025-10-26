// Menu Management Interfaces

export interface Menu {
  menu_id: number;
  menu_name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  menu_item_id: number;
  menu_id: number;
  product_id: number;
  quantity: number;
  product_name: string;
  product_price: number;
  product_description?: string;
  category_name: string;
  subcategory_name: string;
}

export interface MenuWithItems {
  menu_info: Menu;
  items: MenuItem[];
}

export interface MenuCalculatedPrice {
  menu_id: number;
  menu_name: string;
  description?: string;
  manual_price: number;
  image_url?: string;
  is_available: boolean;
  calculated_price: number;
  price_difference: number;
  items_count: number;
}

// Form interfaces
export interface CreateMenuRequest {
  menu_name: string;
  description?: string;
  price: number;
  image_url?: string;
}

export interface UpdateMenuRequest {
  menu_name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  is_available?: boolean;
}

export interface AddMenuItemRequest {
  product_id: number;
  quantity: number;
}

export interface UpdateMenuItemRequest {
  quantity: number;
}
