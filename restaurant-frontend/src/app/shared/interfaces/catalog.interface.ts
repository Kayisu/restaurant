export interface Category {
  category_id: number;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  subcategory_id: number;
  category_id: number;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcessedImages {
  card: {
    url: string;
    width: number;
    height: number;
    ratio: number;
  };
  detail: {
    url: string;
    width: number;
    height: number;
    ratio: number;
  };
}

export interface Product {
  product_id: string; // Backend'te string format: "category.subcategory.product_number"
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  preparation_time?: number;
  image_url?: string;
  processedImages?: ProcessedImages;
  created_at: string;
  updated_at: string;
  subcategory_name: string;
  category_name: string;
  subcategory_id: number;
  category_id: number | null;
  created_by?: number;
  updated_by?: number;
}

export interface ProductOption {
  option_id: number;
  name: string;
  description?: string;
  price_adjustment: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogState {
  selectedCategory: Category | null;
  selectedSubcategory: Subcategory | null;
  selectedProduct: Product | null;
  selectedOptions: ProductOption[];
}

export interface ImageConfig {
  entityType: 'category' | 'subcategory' | 'product' | 'menu';
  recommendedDimensions: { width: number; height: number };
  maxFileSize: number;
  allowedTypes: string[];
}

export interface ImageUploadConfig {
  type: 'category' | 'subcategory' | 'product' | 'menu';
  variant: 'card' | 'detail';
  recommendedDimensions: { width: number; height: number };
  maxFileSize: number;
  allowedTypes: string[];
  multiple?: boolean;
  maxFiles?: number;
  showPreview?: boolean;
  showProgress?: boolean;
}
