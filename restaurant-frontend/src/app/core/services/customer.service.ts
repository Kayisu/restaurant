import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../../shared/interfaces/restaurant.interface';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Create new customer
  createCustomer(customerData: CreateCustomerRequest): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(`${this.baseUrl}/customers`, customerData);
  }

  // Get all customers with pagination and search
  getCustomers(page: number = 1, limit: number = 20, search?: string): Observable<ApiResponse<Customer[]>> {
    let url = `${this.baseUrl}/customers?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get<ApiResponse<Customer[]>>(url);
  }

  // Get customer by ID
  getCustomerById(customerId: number): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.baseUrl}/customers/${customerId}`);
  }

  // Update customer
  updateCustomer(customerId: number, customerData: UpdateCustomerRequest): Observable<ApiResponse<Customer>> {
    
    return this.http.put<ApiResponse<Customer>>(`${this.baseUrl}/customers/${customerId}`, customerData);
  }

  // Delete customer
  deleteCustomer(customerId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/customers/${customerId}`);
  }

  // Search customers
  searchCustomers(searchTerm: string): Observable<ApiResponse<Customer[]>> {
    return this.http.get<ApiResponse<Customer[]>>(`${this.baseUrl}/customers/search?search=${encodeURIComponent(searchTerm)}`);
  }

  // Get customer statistics
  getCustomerStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/customers/stats`);
  }
}
