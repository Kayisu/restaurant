// Dashboard-specific interfaces for improved type safety
import { Reservation, Table, DashboardStats as BaseDashboardStats, TableSection as BaseTableSection } from './restaurant.interface';

export interface DashboardReservation extends Reservation {
  // Extended fields that might come from the API
  table_number?: string;
  section_code?: string;
  server_name?: string;
  total_amount?: number;
  order_count?: number;
  table_id: string; // Ensure this exists
  reservation_id: number; // Ensure this exists
}

export interface DashboardFilters {
  date?: string;
  table_id?: string;
  status?: string;
  customer_name?: string;
  customer_phone?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface SanitizedFilters {
  date?: string;
  table_id?: string;
  status?: string;
  customer_name?: string;
  customer_phone?: string;
  sort_by: string;
  sort_order: string;
}

export interface DashboardTableData extends Table {
  server_name?: string;
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
  table_id: string; // Ensure this exists
}

export interface DashboardSectionSummary {
  section_code: string;
  section_name: string;
  total_tables: number;
  occupied_tables: number;
  available_tables: number;
  reserved_tables: number;
}

// Re-export the base interfaces to avoid conflicts
export type { DashboardStats, TableSection } from './restaurant.interface';
