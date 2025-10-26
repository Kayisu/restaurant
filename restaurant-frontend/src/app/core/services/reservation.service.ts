import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  Reservation, 
  CreateReservationRequest, 
  UpdateReservationRequest,
  ReservationStats 
} from '../../shared/interfaces/restaurant.interface';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Generic HTTP methods
  private get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      params,
      withCredentials: true
    };
    return this.http.get<T>(url, options);
  }

  private post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, {
      withCredentials: true
    });
  }

  private put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, {
      withCredentials: true
    });
  }

  private delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
      withCredentials: true
    });
  }

  // Reservation CRUD operations
  createReservation(reservationData: CreateReservationRequest): Observable<ApiResponse<Reservation>> {
    return this.post<ApiResponse<Reservation>>('/reservations', reservationData);
  }

  // Get all reservations
  getAllReservations(page: number = 1, limit: number = 20, date?: string): Observable<ApiResponse<Reservation[]>> {
    const params: Record<string, any> = { page, limit };
    if (date) params['date'] = date;
    return this.get<ApiResponse<Reservation[]>>('/reservations', params);
  }

  // Get reservation by ID
  getReservationById(id: number): Observable<ApiResponse<Reservation>> {
    return this.get<ApiResponse<Reservation>>(`/reservations/${id}`);
  }

  // Get today's reservations
  getTodayReservations(): Observable<ApiResponse<Reservation[]>> {
    return this.get<ApiResponse<Reservation[]>>('/reservations/today');
  }

  updateReservation(id: number, updateData: UpdateReservationRequest): Observable<ApiResponse<Reservation>> {
    return this.put<ApiResponse<Reservation>>(`/reservations/${id}`, updateData);
  }

  deleteReservation(id: number): Observable<ApiResponse<any>> {
    return this.delete<ApiResponse<any>>(`/reservations/${id}`);
  }

  // Special reservation queries
  getReservationsByTable(tableId: string, date?: string): Observable<ApiResponse<Reservation[]>> {
    const params: Record<string, any> = {};
    if (date) params['date'] = date;
    return this.get<ApiResponse<Reservation[]>>(`/reservations/table/${tableId}`, params);
  }

  getReservationStats(): Observable<ApiResponse<any>> {
    return this.get<ApiResponse<any>>('/reservations/stats');
  }

  // Advanced filtering with backend's sophisticated API
  getAdvancedFilteredReservations(filters: {
    page?: number;
    limit?: number;
    date?: string;
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    table_id?: string;
    section_code?: string;
    status?: string;
    customer_name?: string;
    customer_phone?: string;
    party_size_min?: number;
    party_size_max?: number;
    created_by?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Observable<ApiResponse<Reservation[]>> {
    const params: Record<string, string> = {};

    // Add all filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'number') {
          params[key] = value.toString();
        } else {
          params[key] = value;
        }
      }
    });

    return this.get<ApiResponse<any>>('/reservations/advanced/filter', params);
  }

  // Table availability checking
  getTableAvailability(date?: string, startTime?: string, endTime?: string, sectionCode?: string): Observable<ApiResponse<any[]>> {
    const params: Record<string, string> = {};
    if (date) params['date'] = date;
    if (startTime) params['start_time'] = startTime;
    if (endTime) params['end_time'] = endTime;
    if (sectionCode) params['section_code'] = sectionCode;

    return this.get<ApiResponse<any[]>>('/reservations/availability', params);
  }

  // Check overdue reservations
  checkOverdueReservations(): Observable<ApiResponse<any>> {
    return this.post<ApiResponse<any>>('/reservations/check-overdue', {});
  }

  // Get overdue reservations
  getOverdueReservations(): Observable<ApiResponse<Reservation[]>> {
    return this.get<ApiResponse<Reservation[]>>('/reservations/overdue');
  }
}
