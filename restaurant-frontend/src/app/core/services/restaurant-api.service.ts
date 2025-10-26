import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Table, 
  TableSection, 
  TableStatus, 
  DashboardStats, 
  SectionSummary, 
  Order, 
  CreateOrderRequest,
  ApiResponse,
  PaginatedResponse,
  Bill,
  BillProduct,
  CreateBillRequest,
  UpdateBillRequest,
  AddBillProductRequest,
  UpdateBillProductRequest
} from '../../shared/interfaces';


@Injectable({
  providedIn: 'root'
})
export class RestaurantApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Generic GET method with query parameters
  get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { 
      params: httpParams,
      withCredentials: true 
    });
  }

  // Generic POST method
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, {
      withCredentials: true
    });
  }

  // Generic PUT method
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, {
      withCredentials: true
    });
  }

  // Generic DELETE method
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
      withCredentials: true
    });
  }

  // Generic PATCH method
  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body, {
      withCredentials: true
    });
  }

  private buildQueryString(params: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });

    return queryParams.toString();
  }

  // Helper method for search endpoints
  search<T>(endpoint: string, query: string, additionalParams?: Record<string, any>): Observable<T> {
    const params = { q: query, ...additionalParams };
    return this.get<T>(endpoint, params);
  }


  getTables(): Observable<ApiResponse<Table[]>> {
    return this.get<ApiResponse<Table[]>>('/tables');
  }

  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.get<ApiResponse<DashboardStats>>('/tables/dashboard/stats');
  }

  getTableSections(): Observable<ApiResponse<TableSection[]>> {
    return this.get<ApiResponse<TableSection[]>>('/tables/sections');
  }

  getSectionSummary(lang: string = 'tr'): Observable<ApiResponse<SectionSummary[]>> {
    return this.get<ApiResponse<SectionSummary[]>>('/tables/sections/summary', { lang });
  }

  getSectionTables(sectionCode: string): Observable<ApiResponse<Table[]>> {
    return this.get<ApiResponse<Table[]>>(`/tables/sections/${sectionCode}`);
  }

  getTableById(tableId: string): Observable<ApiResponse<Table>> {
    return this.get<ApiResponse<Table>>(`/tables/${tableId}`);
  }



  updateTableStatus(tableId: string, status: TableStatus): Observable<ApiResponse<Table>> {
    return this.put<ApiResponse<Table>>(`/tables/${tableId}/status`, status);
  }

  // Clear customer data from table
  clearTableCustomer(tableId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/tables/${tableId}/clear`, {}, {
      withCredentials: true
    });
  }

  updateTableReservationStatus(tableId: string, data: { is_reserved: boolean }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/tables/${tableId}/reservation`, data, {
      withCredentials: true
    });
  }

  // Table CRUD Operations
  createTable(tableData: { table_id: string; capacity: number }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/tables`, tableData, {
      withCredentials: true
    });
  }

  updateTable(tableId: string, updateData: { capacity?: number }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/tables/${tableId}`, updateData, {
      withCredentials: true
    });
  }

  deleteTable(tableId: string, options?: { forceDelete?: boolean }): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/tables/${tableId}`, {
      withCredentials: true,
      body: options
    });
  }

  getTableOrders(tableId: string): Observable<ApiResponse<Order[]>> {
    return this.get<ApiResponse<Order[]>>(`/tables/${tableId}/orders`);
  }


  // Seat Customer
  seatCustomer(tableId: string, customerId?: number): Observable<ApiResponse<any>> {
    return this.post<ApiResponse<any>>('/orders/seat-customer', {
      table_id: tableId,
      customer_id: customerId
    });
  }

  // Create Order (after customer is seated)
  createOrder(tableId: string, customerId?: number): Observable<ApiResponse<Order>> {
    return this.post<ApiResponse<Order>>('/orders/create', {
      table_id: tableId,
      customer_id: customerId
    });
  }

  // Add Product to Order (Katalog'dan)
  addProductToOrder(orderId: number, productId: string, quantity: number = 1): Observable<ApiResponse<any>> {
    return this.post<ApiResponse<any>>('/orders/add-from-catalog', {
      order_id: orderId,
      product_id: productId,
      quantity: quantity
    });
  }

  // Add Menu to Order (from Ready Menu)
  addMenuToOrder(orderId: number, menuId: string, quantity: number = 1): Observable<ApiResponse<any>> {
    return this.post<ApiResponse<any>>('/orders/add-from-menu', {
      order_id: orderId,
      menu_id: menuId,
      quantity: quantity
    });
  }

  // Legacy method - kept for backward compatibility
  createTableOrder(tableId: string, orderData: CreateOrderRequest): Observable<ApiResponse<Order>> {
    // Backend uses add-from-catalog endpoint
    return this.post<ApiResponse<Order>>(`/orders/add-from-catalog`, { 
      table_id: tableId, 
      ...orderData 
    });
  }

  getActiveTableOrder(tableId: string): Observable<ApiResponse<Order>> {
    return this.get<ApiResponse<Order>>(`/orders/table/${tableId}/active`);
  }

  

  getMenus(): Observable<ApiResponse<any[]>> {
    return this.get<ApiResponse<any[]>>('/menus');
  }

  getMenuDetails(menuId: number): Observable<ApiResponse<any>> {
    return this.get<ApiResponse<any>>(`/orders/menus/${menuId}`);
  }


  // Get all menus including inactive (admin only)
  getAllMenus(): Observable<ApiResponse<any[]>> {
    return this.get<ApiResponse<any[]>>('/menus/admin/all');
  }

  // Get menu by ID (admin)
  getMenuById(menuId: number): Observable<ApiResponse<any>> {
    return this.get<ApiResponse<any>>(`/menus/${menuId}`);
  }

  // Create menu
  createMenu(menuData: any): Observable<ApiResponse<any>> {
    return this.post<ApiResponse<any>>('/menus', menuData);
  }

  // Update menu
  updateMenu(menuId: number, menuData: any): Observable<ApiResponse<any>> {
    return this.put<ApiResponse<any>>(`/menus/${menuId}`, menuData);
  }

  // Delete menu (hard delete)
  deleteMenu(menuId: number): Observable<ApiResponse<any>> {
    return this.delete<ApiResponse<any>>(`/menus/${menuId}/hard`);
  }

  // Get menu items
  getMenuItems(menuId: number): Observable<ApiResponse<any>> {
    return this.get<ApiResponse<any>>(`/menus/${menuId}/items`);
  }

  // Add product to menu
  addProductToMenu(menuId: number, productData: any): Observable<ApiResponse<any>> {
    return this.post<ApiResponse<any>>(`/menus/${menuId}/items`, productData);
  }

  // Update product quantity in menu
  updateMenuProductQuantity(menuId: number, productId: number, quantity: number): Observable<ApiResponse<any>> {
    return this.put<ApiResponse<any>>(`/menus/${menuId}/items/${productId}`, { quantity });
  }

  // Remove product from menu
  removeProductFromMenu(menuId: number, productId: number): Observable<ApiResponse<any>> {
    return this.delete<ApiResponse<any>>(`/menus/${menuId}/items/${productId}`);
  }

  // Update menu item quantity by menu_item_id
  updateMenuItemQuantity(menuItemId: number, quantity: number): Observable<ApiResponse<any>> {
    // Try different possible endpoints
    return this.put<ApiResponse<any>>(`/menus/items/${menuItemId}/quantity`, { quantity });
  }

  // Get menu items with calculated price
  getMenuItemsWithCalculatedPrice(menuId: number): Observable<ApiResponse<any>> {
    return this.get<ApiResponse<any>>(`/menus/${menuId}/calculated-price`);
  }

  updateOrderItem(itemId: number, updates: any): Observable<ApiResponse<any>> {
    // Backend uses /:orderId/items/:itemId pattern
    // Get orderId from updates
    const orderId = updates.order_id;
    return this.put<ApiResponse<any>>(`/orders/${orderId}/items/${itemId}`, updates);
  }

  removeOrderItem(itemId: number, orderId: number): Observable<ApiResponse<any>> {
    // Backend uses /:orderId/items/:itemId pattern
    return this.delete<ApiResponse<any>>(`/orders/${orderId}/items/${itemId}`);
  }


  // Close order (complete and clear table)
  closeOrder(orderId: number, paymentMethod: string = 'cash', paymentAmount?: number): Observable<ApiResponse<Order>> {
    return this.put<ApiResponse<Order>>(`/orders/${orderId}/close`, { 
      payment_method: paymentMethod, 
      payment_amount: paymentAmount 
    });
  }

  // Cancel order
  cancelOrder(orderId: number): Observable<ApiResponse<Order>> {
    return this.put<ApiResponse<Order>>(`/orders/${orderId}/cancel`, {});
  }

  // Get all bills
  getAllBills(): Observable<ApiResponse<Bill[]>> {
    return this.get<ApiResponse<Bill[]>>('/bills');
  }

  // Get bill by ID
  getBillById(billId: number): Observable<ApiResponse<Bill>> {
    return this.get<ApiResponse<Bill>>(`/bills/${billId}`);
  }

  // Create bill
  createBill(billData: CreateBillRequest): Observable<ApiResponse<Bill>> {
    return this.post<ApiResponse<Bill>>('/bills', billData);
  }

  // Update bill
  updateBill(billId: number, updateData: UpdateBillRequest): Observable<ApiResponse<Bill>> {
    
    return this.put<ApiResponse<Bill>>(`/bills/${billId}`, updateData);
  }

  // Delete bill
  deleteBill(billId: number): Observable<ApiResponse<Bill>> {
    return this.delete<ApiResponse<Bill>>(`/bills/${billId}`);
  }

  // Add product to bill
  addBillProduct(billId: number, productData: AddBillProductRequest): Observable<ApiResponse<BillProduct>> {
    return this.post<ApiResponse<BillProduct>>(`/bills/${billId}/products`, productData);
  }

  // Add menu to bill
  addBillMenu(billId: number, menuData: { menu_id: string; quantity: number; unit_price: number; total_price: number; discount_amount?: number }): Observable<ApiResponse<any>> {
    return this.post<ApiResponse<any>>(`/bills/${billId}/menus`, menuData);
  }

  // Update bill product
  updateBillProduct(billProductId: number, updateData: UpdateBillProductRequest): Observable<ApiResponse<BillProduct>> {
    return this.put<ApiResponse<BillProduct>>(`/bills/products/${billProductId}`, updateData);
  }

  // Delete bill product
  deleteBillProduct(billProductId: number): Observable<ApiResponse<any>> {
    return this.delete<ApiResponse<any>>(`/bills/products/${billProductId}`);
  }

  // Remove product from bill
  removeBillProduct(billProductId: number): Observable<ApiResponse<BillProduct>> {
    return this.delete<ApiResponse<BillProduct>>(`/bills/products/${billProductId}`);
  }

  // Get bills by customer
  getBillsByCustomer(customerId: number): Observable<ApiResponse<Bill[]>> {
    return this.get<ApiResponse<Bill[]>>(`/bills/customer/${customerId}`);
  }

  // Get bills by order
  getBillsByOrder(orderId: number): Observable<ApiResponse<Bill[]>> {
    return this.get<ApiResponse<Bill[]>>(`/bills/order/${orderId}`);
  }

  // Generate bill number
  generateBillNumber(): Observable<ApiResponse<{ bill_number: string }>> {
    return this.get<ApiResponse<{ bill_number: string }>>('/bills/generate-number');
  }

  // Get all orders with filters
  getOrders(filters?: {
    status?: string;
    order_type?: string;
    table_id?: string;
    customer_name?: string;
    date_from?: string;
    date_to?: string;
    server_id?: number;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<Order[]>> {
    return this.get<ApiResponse<Order[]>>('/orders', filters);
  }

  // Get order by ID
  getOrder(orderId: number): Observable<ApiResponse<Order>> {
    return this.get<ApiResponse<Order>>(`/orders/${orderId}`);
  }

  // Get order statistics
  getOrderStats(): Observable<ApiResponse<{
    total_orders: number;
    active_orders: number;
    completed_orders: number;
    pending_orders: number;
    preparing_orders: number;
    ready_orders: number;
    total_revenue: number;
    average_order_value: number;
  }>> {
    return this.get<ApiResponse<{
      total_orders: number;
      active_orders: number;
      completed_orders: number;
      pending_orders: number;
      preparing_orders: number;
      ready_orders: number;
      total_revenue: number;
      average_order_value: number;
    }>>('/orders/stats');
  }

  // Update order status
  updateOrderStatus(orderId: number, status: string): Observable<ApiResponse<Order>> {
    return this.put<ApiResponse<Order>>(`/orders/${orderId}/status`, { status });
  }

  // Complete order
  completeOrder(orderId: number): Observable<ApiResponse<Order>> {
    return this.put<ApiResponse<Order>>(`/orders/${orderId}/complete`, {});
  }

  // Get order items
  getOrderItems(orderId: number): Observable<ApiResponse<{
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
    }[]>> {
    return this.get<ApiResponse<{
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
    }[]>>(`/orders/${orderId}/items`);
  }

  // Bill Management Methods
  completeBill(billId: number): Observable<ApiResponse<any>> {
    return this.put<ApiResponse<any>>(`/bills/${billId}/complete`, {});
  }

  cancelBill(billId: number): Observable<ApiResponse<any>> {
    return this.put<ApiResponse<any>>(`/bills/${billId}/cancel`, {});
  }

  updateBillStatus(billId: number, status: string): Observable<ApiResponse<any>> {
    
    return this.put<ApiResponse<any>>(`/bills/${billId}/status`, { status });
  }
}
