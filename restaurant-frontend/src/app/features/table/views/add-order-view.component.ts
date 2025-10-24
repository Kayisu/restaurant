import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RestaurantApiService } from '../../../core/services/restaurant-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-add-order-view',
  imports: [CommonModule],
  styleUrl: './styles/add-order-view.component.scss',
  template: `
    <div class="add-order-container">
      <div class="add-order-header">
        <h2>Order Management</h2>
        <div class="table-info">
          <span class="table-id">Table {{ tableId }}</span>
        </div>
      </div>

                    <div class="add-order-content">
         <!-- Loading State -->
         <div class="loading-state" *ngIf="loading">
           <div class="loading-spinner">⏳</div>
           <p>Loading table status...</p>
         </div>

         <!-- Seat Customer Message (if table is available) -->
         <div class="seat-customer-message" *ngIf="!loading && tableStatus === 'available'">
           <div class="message-icon">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
               <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
               <circle cx="9" cy="7" r="4"/>
               <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
               <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
             </svg>
           </div>
           <h3>Seat Customer</h3>
           <p>This table is currently available. Please seat a customer before starting an order.</p>
         </div>

         <!-- Order Options (if table is not available) -->
         <div class="order-options" *ngIf="!loading && tableStatus !== 'available'">
          <div class="option-card" (click)="startNewOrder()" [class.disabled]="hasActiveOrder">
            <div class="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <h3>Start New Order</h3>
            <p>Browse our menu and add items to your order</p>
            <button class="btn btn-primary" (click)="startNewOrder()" [disabled]="hasActiveOrder">
              Start New Order
            </button>
          </div>

          <div class="option-card" (click)="goToCurrentOrder()" [class.disabled]="!hasActiveOrder">
            <div class="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <h3>View Current Order</h3>
            <p>Check items, modify quantities, and manage your current order</p>
            <button class="btn btn-primary" (click)="goToCurrentOrder()" [disabled]="!hasActiveOrder">
              View Order
            </button>
          </div>

  `
})
export class AddOrderViewComponent implements OnInit {
  @Input() tableId: string = '';
  tableStatus: string = '';
  loading = false;
  hasActiveOrder = false;
  
  constructor(
    private router: Router,
    private restaurantApi: RestaurantApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTableStatus();
    this.checkActiveOrder();
  }



  async loadTableStatus() {
    if (!this.tableId) {
      return;
    }
    
    this.loading = true;
    
    try {
      const response = await firstValueFrom(this.restaurantApi.getTables());
      
      if (response?.success && Array.isArray(response.data)) {
        const table = response.data.find(t => t.table_id === this.tableId);
        
        if (table) {
          // Check is_occupied instead of table_status
          if (table.is_occupied) {
            this.tableStatus = 'occupied';
          } else if (table.is_reserved) {
            this.tableStatus = 'reserved';
          } else {
            this.tableStatus = 'available';
          }
        } else {
          this.tableStatus = 'available';
        }
      } else {
        this.tableStatus = 'available';
      }
    } catch (error) {
      this.tableStatus = 'available';
    } finally {
      this.loading = false;
      
      // Force change detection in zoneless mode
      this.cdr.detectChanges();
    }
  }

  startNewOrder(): void {
    // Don't allow starting new order if there's already an active order
    if (this.hasActiveOrder) {
      return;
    }
    this.router.navigate(['/table', this.tableId, 'order-type']);
  }

  async checkActiveOrder() {
    if (!this.tableId) return;
    
    try {
      const response = await firstValueFrom(this.restaurantApi.getActiveTableOrder(this.tableId));
      this.hasActiveOrder = response?.success && !!response.data;
    } catch (error: any) {
      // 404 means no active order
      this.hasActiveOrder = error.status !== 404;
    }
    
    this.cdr.detectChanges();
  }

  goToCurrentOrder(): void {
    if (this.hasActiveOrder) {
      this.router.navigate(['/table', this.tableId, 'current-order']);
    }
  }

  goToOrderHistory(): void {
    this.router.navigate(['/table', this.tableId, 'order-history']);
  }
}
