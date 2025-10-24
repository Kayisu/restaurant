import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RestaurantApiService } from '../../../core/services/restaurant-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface TableInfo {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  customerCount?: number;
  customerName?: string;
  customerPhone?: string;
  reservationTime?: string;
  reservationDate?: string;
  reservationStatus?: string;
  reservedCustomerName?: string;
  reservedCustomerPhone?: string;
  reservedPartySize?: number;
  occupiedSince?: string;
  occupiedDuration?: string;
  totalAmount?: number;
  orderCount?: number;
  lastOrderTime?: string;
}

@Component({
  standalone: true,
  selector: 'app-table-status-view',
  imports: [CommonModule],
  styleUrl: './styles/table-status-view.component.scss',
  template: `
    <div class="table-status-container">
      <div class="status-header">
        <h2>Table Status</h2>
        <div class="header-actions">
          <div class="status-badge" [class]="getStatusClass()">
            {{ getStatusText() }}
          </div>
        </div>
      </div>

      <div class="table-info-grid" *ngIf="tableData">
        <div class="info-section">
          <h3>Table Information</h3>
          <div class="info-items">
            <div class="info-item">
              <span class="label">Table Number:</span>
              <span class="value">{{ tableData.number }}</span>
            </div>
            <div class="info-item">
              <span class="label">Capacity:</span>
              <span class="value">{{ tableData.capacity }} people</span>
            </div>
            <div class="info-item">
              <span class="label">Status:</span>
              <span class="value">{{ getStatusText() }}</span>
            </div>

          </div>
        </div>

        <!-- Customer Information (if occupied) -->
        <div class="info-section" *ngIf="tableData.status === 'occupied' && (tableData.customerName || tableData.customerCount)">
          <h3>Customer Information</h3>
          <div class="info-items">
            <div class="info-item" *ngIf="tableData.customerName">
              <span class="label">Customer Name:</span>
              <span class="value">{{ tableData.customerName }}</span>
            </div>
            <div class="info-item" *ngIf="tableData.customerPhone">
              <span class="label">Customer Phone:</span>
              <span class="value">{{ tableData.customerPhone }}</span>
            </div>
            <div class="info-item" *ngIf="tableData.customerCount">
              <span class="label">Party Size:</span>
              <span class="value">{{ tableData.customerCount }} people</span>
            </div>
            <div class="info-item" *ngIf="tableData.occupiedSince">
              <span class="label">Occupied Since:</span>
              <span class="value">{{ tableData.occupiedSince }}</span>
            </div>
            <div class="info-item" *ngIf="tableData.occupiedDuration">
              <span class="label">Duration:</span>
              <span class="value">{{ tableData.occupiedDuration }}</span>
            </div>
          </div>
        </div>



        <!-- Order Information (if has orders) -->
        <div class="info-section" *ngIf="tableData.orderCount && tableData.orderCount > 0">
          <h3>Order Information</h3>
          <div class="info-items">
            <div class="info-item" *ngIf="tableData.orderCount">
              <span class="label">Active Orders:</span>
              <span class="value">{{ tableData.orderCount }}</span>
            </div>
            <div class="info-item" *ngIf="tableData.totalAmount">
              <span class="label">Total Amount:</span>
              <span class="value">₺{{ tableData.totalAmount }}</span>
            </div>
            <div class="info-item" *ngIf="tableData.lastOrderTime">
              <span class="label">Last Order:</span>
              <span class="value">{{ tableData.lastOrderTime }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="action-buttons" *ngIf="tableData">
        <button 
          class="btn btn-primary" 
          *ngIf="tableData.status === 'available'"
          (click)="seatCustomer()">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Seat Customer
        </button>
        <button 
          class="btn btn-secondary" 
          *ngIf="tableData.status === 'available'"
          (click)="createReservation()">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <path d="M16 2v4"/>
            <path d="M8 2v4"/>
            <path d="M3 10h18"/>
          </svg>
          Create Reservation
        </button>
        <button 
          class="btn btn-success" 
          *ngIf="tableData.status === 'occupied'"
          [disabled]="hasActiveOrder()"
          (click)="clearTable()">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Clear Table
        </button>
        <button 
          class="btn btn-danger" 
          *ngIf="tableData.status === 'reserved'"
          (click)="cancelReservation()">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18"/>
            <path d="M6 6l12 12"/>
          </svg>
          Cancel Reservation
        </button>
        <button 
          class="btn btn-outline"
          (click)="refreshTableData()">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>
  `
})
export class TableStatusViewComponent {
  // NOTE: We no longer use the incoming value directly
  private _table = signal<TableInfo | null>(null)
  private _hasActiveOrder = signal<boolean>(false);

  @Input() set tableInfo(value: TableInfo | null) {
    // Shallow copy to avoid mutating the reference
    this._table.set(value ? { ...value } : null);
    
    // Check for active orders when table info is set
    if (value?.id) {
      this.checkActiveOrder(value.id);
    }
  }

  get tableData(): TableInfo | null {
    return this._table();
  }

  hasActiveOrder(): boolean {
    return this._hasActiveOrder();
  }

  async checkActiveOrder(tableId: string): Promise<void> {
    try {
      const orderResponse = await firstValueFrom(this.restaurantApi.getActiveTableOrder(tableId));
      // Check if order exists AND has items
      const hasOrder = orderResponse?.success && !!orderResponse.data;
      const hasItems = hasOrder && orderResponse.data.items && orderResponse.data.items.length > 0;
      this._hasActiveOrder.set(hasItems);
    } catch (error: any) {
      // 404 means no active order
      this._hasActiveOrder.set(error.status !== 404);
    }
  }

  constructor(
    private restaurantApi: RestaurantApiService,
    private toastService: ToastService,
    private router: Router,
    private authService: AuthService
  ) {}

  getStatusClass(): string {
    const t = this._table();
    return t?.status ?? 'available';
  }

  getStatusText(): string {
    const t = this._table();
    if (!t) return 'Available';
    const map = {
      available: 'Available',
      occupied: 'Occupied',
      reserved: 'Reserved',
      cleaning: 'Cleaning'
    } as const;
    return map[t.status] ?? 'Unknown';
  }

  async seatCustomer(): Promise<void> {
    const t = this._table();
    if (!t) return;
    try {
      // const response = await firstValueFrom(this.restaurantApi.updateTableStatus(t.id, { is_occupied: true }));
      const response = await this.restaurantApi.updateTableStatus(t.id, { 
        is_occupied: true,
        is_reserved: false 
      }).toPromise();
      if (response?.success) {
        this._table.update(x => x ? { ...x, status: 'occupied' } : x);
        this.toastService.success('Table Occupied', `Table ${t.number} is now occupied`);
        
        // Navigate to table detail page with status tab
        this.router.navigate(['/table', t.id], { queryParams: { tab: 'status' } });
      } else {
        throw new Error('Backend response failed');
      }
    } catch {
      this._table.update(x => x ? { ...x, status: 'occupied' } : x);
      this.toastService.info('Local Update', `Table ${t.number} marked as occupied (local only)`);
      
      // Still navigate even if backend failed
      this.router.navigate(['/table', t.id], { queryParams: { tab: 'status' } });
    }
  }

  async clearTable(): Promise<void> {
    const t = this._table();
    if (!t) return;

    // Check if table has active orders with items before clearing
    try {
      const orderResponse = await firstValueFrom(this.restaurantApi.getActiveTableOrder(t.id));
      
      if (orderResponse?.success && orderResponse.data) {
        // Table has active order (with or without items), cannot clear
        this.toastService.error(
          'Cannot Clear Table', 
          `Table ${t.number} has an active order. Please complete the order first.`
        );
        return;
      } else {
        // No active order, can clear
      }
    } catch (error: any) {
      if (error.status === 404) {
        // 404 means no active order, which is good
      } else {
        this.toastService.error(
          'Error', 
          'Could not verify order status. Please try again.'
        );
        return;
      }
    }

    // Proceed with clearing table
    try {
      
      // First clear customer data
      try {
        const clearResponse = await firstValueFrom(this.restaurantApi.clearTableCustomer(t.id));
      } catch (clearError) {
        // Continue even if customer clear fails
      }

      // Then update table status
      const response = await this.restaurantApi.updateTableStatus(t.id, { 
        is_occupied: false,
        is_reserved: false,
        table_status: 'available'
      }).toPromise();
      
      
      if (response?.success) {
        this._table.update(x => x ? { ...x, status: 'available' } : x);
        this._hasActiveOrder.set(false); // Clear the active order flag
        this.toastService.success('Table Cleared', `Table ${t.number} is now available`);
      } else {
        throw new Error('Backend response failed');
      }
    } catch (error) {
      this._table.update(x => x ? { ...x, status: 'available' } : x);
      this._hasActiveOrder.set(false); // Clear the active order flag
      this.toastService.info('Local Update', `Table ${t.number} marked as available (local only)`);
    }
  }


  async reserveTable(): Promise<void> {
    const t = this._table();
    if (!t) return;
    try {
      const response = await this.restaurantApi.updateTableReservationStatus(t.id, { 
        is_reserved: true 
      }).toPromise();
      if (response?.success) {
        this._table.update(x => x ? { ...x, status: 'reserved' } : x);
        this.toastService.success('Table Reserved', `Table ${t.number} has been reserved`);
      } else {
        throw new Error('Backend response failed');
      }
    } catch {
      this._table.update(x => x ? { ...x, status: 'reserved' } : x);
      this.toastService.info('Local Update', `Table ${t.number} marked as reserved (local only)`);
    }
  }

  async cancelReservation(): Promise<void> {
    const t = this._table();
    if (!t) return;
    try {
      const response = await this.restaurantApi.updateTableReservationStatus(t.id, { 
        is_reserved: false 
      }).toPromise();
      if (response?.success) {
        this._table.update(x => x ? { ...x, status: 'available' } : x);
        this.toastService.success('Reservation Cancelled', `Table ${t.number} is now available`);
      } else {
        throw new Error('Backend response failed');
      }
    } catch {
      this._table.update(x => x ? { ...x, status: 'available' } : x);
      this.toastService.info('Local Update', `Table ${t.number} reservation cancelled (local only)`);
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  refreshTableData(): void {
    const t = this._table();
    if (!t) return;
    this.toastService.info('Refresh', `Refreshing data for Table ${t.number}...`);
    // Trigger page reload to get fresh data from backend
    window.location.reload();
  }

  createReservation(): void {
    const t = this._table();
    if (!t) return;
    this.router.navigate(['/reservations/create'], {
      queryParams: { tableId: t.id }
    });
  }


}
