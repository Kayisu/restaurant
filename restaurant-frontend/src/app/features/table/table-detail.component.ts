import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RestaurantApiService } from '../../core/services/restaurant-api.service';
import { ToastService } from '../../core/services/toast.service';
import { TableStatusViewComponent } from './views/table-status-view.component';
import { AddOrderViewComponent } from './views/add-order-view.component';

@Component({
  standalone: true,
  selector: 'app-table-detail',
  imports: [
    CommonModule,
    TableStatusViewComponent,
    AddOrderViewComponent
  ],
  styleUrl: './table-detail.component.scss',
  template: `
    <div class="table-detail-container">
      <div class="table-detail-header">
        <button class="back-btn" (click)="goBack()">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div class="table-info">
        <h1>Table {{ tableId }}</h1>
        <div class="table-capacity" *ngIf="tableInfo()?.capacity">
          <svg class="capacity-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span class="capacity-text">{{ tableInfo()?.capacity }} seats</span>
        </div>
      </div>

      <div class="table-tabs">
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'status'"
          (click)="setActiveTab('status')">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 9h6v6H9z"/>
            <path d="M9 1v6"/>
            <path d="M15 1v6"/>
            <path d="M9 17v6"/>
            <path d="M15 17v6"/>
            <path d="M1 9h6"/>
            <path d="M17 9h6"/>
            <path d="M1 15h6"/>
            <path d="M17 15h6"/>
          </svg>
          Table Status
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'add-order'"
          (click)="setActiveTab('add-order')">
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          Orders
        </button>
      </div>

      <div class="table-content">
        <!-- Loading State -->
        <div class="loading-state" *ngIf="loading()">
          <div class="loading-spinner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
          </div>
          <p>Loading table information...</p>
        </div>

        <!-- Error State -->
        <div class="error-state" *ngIf="error() && !loading()">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9l-6 6"/>
              <path d="M9 9l6 6"/>
            </svg>
          </div>
          <p>{{ error() }}</p>
          <button class="retry-btn" (click)="loadTableData()">Try Again</button>
        </div>

        <!-- Content -->
        <div *ngIf="!loading() && !error()">
          <app-table-status-view 
            *ngIf="activeTab === 'status'" 
            [tableInfo]="tableInfo()">
          </app-table-status-view>
          
          <app-add-order-view 
            *ngIf="activeTab === 'add-order'" 
            [tableId]="tableId">
          </app-add-order-view>
        </div>
      </div>
    </div>
  `
})
export class TableDetailComponent implements OnInit {
  tableId: string = '';
  activeTab: 'status' | 'add-order' = 'status';
  loading = signal(false);
  error = signal<string | null>(null);
  tableInfo = signal<any>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restaurantApi: RestaurantApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.tableId = this.route.snapshot.paramMap.get('tableId') || '';
    if (!this.tableId) {
      this.error.set('Table ID is required');
      return;
    }

    // Load saved tab from localStorage or URL
    this.loadSavedTab();
    
    // Load table data
    this.loadTableData();
  }

  private loadSavedTab(): void {
    // Try to get from localStorage first
    const savedTab = localStorage.getItem(`table_${this.tableId}_activeTab`);
    
    // Then check URL query params
    const urlTab = this.route.snapshot.queryParamMap.get('tab');
    
    // Normalize tab names
    if (savedTab === 'add-order' || savedTab === 'status') {
      this.activeTab = savedTab as 'status' | 'add-order';
    } else if (urlTab === 'orders') {
      this.activeTab = 'add-order';
    } else if (urlTab === 'status') {
      this.activeTab = 'status';
    }
  }

  private normalizeTab(tabParam: string): ('status' | 'add-order') | null {
    const lower = tabParam.toLowerCase();
    if (lower === 'status') return 'status';
    if (lower === 'orders' || lower === 'add-order') return 'add-order';
    return null;
  }

  async loadTableData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    // Check if we have router state data first
    const routerState = history.state;
    if (routerState && routerState.tableData) {
      this.tableInfo.set(this.mapBackendDataToTableInfo(routerState.tableData));
      this.loading.set(false);
      return;
    }

    try {
      const response = await firstValueFrom(this.restaurantApi.getTableById(this.tableId));
      if (response?.success && response?.data) {
        this.tableInfo.set(this.mapBackendDataToTableInfo(response.data));
      } else {
        throw new Error('Backend response invalid');
      }
    } catch (error) {
      this.error.set('Failed to load table information. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  mapBackendDataToTableInfo(backendData: any) {
    // Safe parsing of table_id
    const tableId = backendData?.table_id || this.tableId;
    const tableNumber = tableId ? parseInt(tableId.replace(/[^0-9]/g, '')) : 0;
    
    return {
      id: tableId,
      number: tableNumber || 0,
      capacity: backendData?.capacity || 4,
      status: this.mapBackendStatus(backendData?.is_occupied, backendData?.is_reserved || false, backendData?.table_status),
      customerCount: backendData?.customer_count,
      customerName: backendData?.customer_name,
      customerPhone: backendData?.customer_phone,
      occupiedSince: backendData?.occupied_since,
      occupiedDuration: backendData?.occupied_duration_formatted,
      totalAmount: backendData?.total_amount,
      orderCount: backendData?.order_item_count,
      lastOrderTime: backendData?.last_order_time
    };
  }

  mapBackendStatus(isOccupied: boolean, isReserved: boolean, tableStatus: string): 'available' | 'occupied' | 'reserved' | 'cleaning' {
    if (isReserved) return 'reserved';
    if (tableStatus === 'cleaning') return 'cleaning';
    return isOccupied ? 'occupied' : 'available';
  }

  setActiveTab(tab: 'status' | 'add-order') {
    this.activeTab = tab;
    // Save active tab to localStorage
    localStorage.setItem(`table_${this.tableId}_activeTab`, tab);
    // Reflect in URL as query param: status | orders
    const tabForUrl = tab === 'add-order' ? 'orders' : tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabForUrl },
      replaceUrl: true
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
