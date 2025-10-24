import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RestaurantApiService } from '../../../core/services/restaurant-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { Order } from '../../../shared/interfaces/order.interface';

interface OrderItem {
  product_name: string;
  order_item_id?: number;
  order_product_id?: number;
  order_menu_id?: number;
  product_id?: number;
  menu_id?: number;
  item_name: string;
  item_description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  assigned_chef?: string;
  created_at: string;
  item_type?: string;
}

@Component({
  selector: 'app-current-order-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="current-order-container">
      <!-- Header -->
      <div class="order-header">
        <div class="header-left">
          <h2>Current Order</h2>
          <div class="table-info">
            <span class="table-id">Table {{ tableId }}</span>
            <span class="order-status" [class]="getStatusClass(order()?.status)">
              {{ getStatusText(order()?.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading order details...</p>
      </div>


      <!-- No Active Order -->
      <div *ngIf="!loading() && !error() && !order()" class="no-order-state">
        <div class="no-order-icon">📋</div>
        <h3>No Active Order</h3>
        <p>This table doesn't have an active order yet.</p>
        <button class="btn-primary" (click)="goToOrderType()">
          Start New Order
        </button>
      </div>

      <!-- Order Details -->
      <div *ngIf="!loading() && !error() && order()" class="order-details">
        <!-- Customer Info -->
        <div class="customer-info" *ngIf="order()?.customer_name">
          <h3>Customer Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Name:</span>
              <span class="value">{{ order()?.customer_name }}</span>
            </div>
            <div class="info-item" *ngIf="order()?.customer_phone">
              <span class="label">Phone:</span>
              <span class="value">{{ order()?.customer_phone }}</span>
            </div>
            <div class="info-item" *ngIf="order()?.server_name">
              <span class="label">Server:</span>
              <span class="value">{{ order()?.server_name }}</span>
            </div>
          </div>
        </div>

        <!-- Order Items -->
        <div class="order-items-section">
          <h3>Order Items ({{ order()?.items?.length || 0 }})</h3>
          
          <div *ngIf="order()?.items?.length === 0" class="empty-items">
            <p>No items in this order yet.</p>
            <button class="btn-secondary" (click)="goToOrderType()">
              Add Items
            </button>
          </div>

          <div *ngIf="order()?.items?.length > 0" class="items-list">
            <div *ngFor="let item of order()?.items" class="item-card">
              <div class="item-info">
                <div class="item-header">
                  <h4>{{ item.product_name || item.item_name || 'Unknown Product' }}</h4>
                  <span class="item-type" *ngIf="item.menu_id">
                    <svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="12" rx="2"/>
                      <path d="M3 9h18"/>
                      <path d="M3 15h18"/>
                      <path d="M9 3v18"/>
                      <path d="M15 3v18"/>
                    </svg>
                    Menu
                  </span>
                  <span class="item-type" *ngIf="item.product_id">
                    <svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="9" cy="21" r="1"/>
                      <circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Product
                  </span>
                </div>
                <p *ngIf="item.item_description" class="item-description">
                  {{ item.item_description }}
                </p>
              </div>

              <div class="item-controls">
                <div class="quantity-controls">
                  <button class="qty-btn" (click)="updateQuantity(item, -1)" 
                          [disabled]="item.quantity <= 1">
                    -
                  </button>
                  <span class="quantity">{{ item.quantity }}</span>
                  <button class="qty-btn" (click)="updateQuantity(item, 1)">
                    +
                  </button>
                </div>
                <div class="item-pricing">
                  <span class="unit-price">₺{{ formatPrice(item.unit_price) }} each</span>
                  <span class="total-price">₺{{ formatPrice(item.total_price) }}</span>
                </div>
                <button class="remove-btn" (click)="removeItem(item)">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div *ngIf="order()?.items?.length > 0" class="order-summary">
          <h3>Order Summary</h3>
          <div class="summary-grid">
            <div class="summary-row">
              <span class="label">Subtotal:</span>
              <span class="value">₺{{ formatPrice(order()?.subtotal) }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Tax (10% KDV):</span>
              <span class="value">₺{{ formatPrice(order()?.tax_amount) }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Service Charge (5%):</span>
              <span class="value">₺{{ formatPrice(order()?.service_charge) }}</span>
            </div>
            <div class="summary-row total">
              <span class="label">Total:</span>
              <span class="value">₺{{ formatPrice(order()?.total_amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="order-actions">
          <button class="btn-secondary" (click)="goToOrderType()" *ngIf="order()">
            + Add More Items
          </button>
          <button class="btn-secondary" (click)="goToTable()">
            ← Back to Table
          </button>
          <button class="btn-primary btn-large" (click)="completeOrder()" 
                  [disabled]="!order() || order()?.items?.length === 0">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Complete Order
          </button>
          <button class="btn-danger btn-large" (click)="cancelOrder()" 
                  [disabled]="!order() || isCancelling()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            {{ isCancelling() ? 'Cancelling...' : 'Cancel Order' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Complete Order Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showCompleteModal()" (click)="closeCompleteModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Complete Order
          </h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to complete this order?</p>
          <div class="order-summary" *ngIf="order()">
            <p><strong>Table:</strong> {{ tableId }}</p>
            <p><strong>Items:</strong> {{ order()?.items?.length || 0 }}</p>
            <p><strong>Total:</strong> {{ formatPrice(order()?.total_amount) }} TL</p>
          </div>
          <p class="info-text">This will create a bill and close the order.</p>
          <p class="admin-info" *ngIf="authService.isAdmin()" class="admin-note">
            💡 As an admin, you can view the bill in billing management after completion.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeCompleteModal()">Cancel</button>
          <button class="btn-confirm" (click)="confirmCompleteOrder(false)" [disabled]="isCompleting()">
            {{ isCompleting() ? 'Completing...' : 'Complete Order' }}
          </button>
          <button class="btn-confirm-admin" (click)="confirmCompleteOrder(true)" [disabled]="isCompleting()" *ngIf="authService.isAdmin()">
            {{ isCompleting() ? 'Completing...' : 'Complete & View Bill Management' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Order Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showCancelModal()" (click)="closeCancelModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Cancel Order</h3>
          <button class="modal-close" (click)="closeCancelModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to cancel this order?</p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeCancelModal()">Cancel</button>
          <button class="btn-danger" (click)="confirmCancelOrder()" [disabled]="isCancelling()">
            {{ isCancelling() ? 'Cancelling...' : 'Cancel Order' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./styles/current-order-view.component.scss']
})
export class CurrentOrderViewComponent implements OnInit {
  tableId: string = '';

  order = signal<Order | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  isCompleting = signal(false);
  showCompleteModal = signal(false);
  isCancelling = signal(false);
  showCancelModal = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restaurantApi: RestaurantApiService,
    private toastService: ToastService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.tableId = this.route.snapshot.paramMap.get('tableId') || '';
    this.loadOrder();
  }

  async loadOrder(): Promise<void> {
    if (!this.tableId) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(this.restaurantApi.getActiveTableOrder(this.tableId));


      if (response?.success && response.data) {

        this.order.set(response.data);
      } else if (response?.success && !response.data) {
        // No active order
        this.order.set(null);
      } else {
        this.error.set('Failed to load order');
      }
    } catch (error: any) {

      // If 404, it means no active order exists
      if (error.status === 404) {
        // Redirect to order type selection to create a new order
        this.router.navigate(['/table', this.tableId, 'order-type']);
        return;
      } else {
        this.error.set('Error loading order');
      }
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  async updateQuantity(item: OrderItem, change: number): Promise<void> {
    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) return;


    let itemId: number | undefined;

    // Backend uses order_menu_id for menu items, order_item_id for product items
    if (item.menu_id) {
      // Menu item - use order_menu_id
      itemId = (item as any).order_menu_id;
    } else if (item.product_id) {
      // Product item - use order_item_id
      itemId = item.order_item_id;
    } else {
      // Fallback - try all possible IDs
      itemId = item.order_item_id || (item as any).order_product_id || (item as any).order_menu_id;
    }

    if (!itemId) {
      this.toastService.error('Update Failed', 'Invalid item ID');
      return;
    }


    try {
      const response = await firstValueFrom(
        this.restaurantApi.updateOrderItem(itemId, {
          quantity: newQuantity,
          order_id: this.order()!.order_id
        })
      );

      if (response?.success) {
        // Update order locally first for immediate UI feedback
        const currentOrder = this.order();
        if (currentOrder && currentOrder.items) {
          const updatedItems = currentOrder.items.map(orderItem => {
            // Check both possible ID fields
            const itemOrderId = orderItem.menu_id ? (orderItem as any).order_menu_id : orderItem.order_item_id;
            if (itemOrderId === itemId) {
              return {
                ...orderItem,
                quantity: newQuantity,
                total_price: parseFloat(orderItem.unit_price?.toString() || '0') * newQuantity
              };
            }
            return orderItem;
          });

          // Update the order signal immediately
          this.order.set({
            ...currentOrder,
            items: updatedItems,
            subtotal: updatedItems.reduce((sum, item) => sum + (item.total_price || 0), 0),
            total_amount: updatedItems.reduce((sum, item) => sum + (item.total_price || 0), 0) * 1.28 // 10% tax + 5% service (default)
          });

          this.cdr.detectChanges(); // Force UI update
        }

        // Then reload from server to get accurate totals
        await this.loadOrder();
        this.toastService.success('Quantity Updated!', `Updated ${item.product_name || item.item_name} quantity to ${newQuantity}`);
      } else {
        this.toastService.error('Update Failed', 'Failed to update item quantity');
      }
    } catch (error) {
      this.toastService.error('Update Failed', 'Error updating item quantity');
    }
  }

  async removeItem(item: OrderItem): Promise<void> {
    // Backend data may have different field names
    // Use order_menu_id for menu items, order_item_id for product items
    let itemId: number | undefined;

    // Backend uses order_menu_id for menu items, order_item_id for product items
    if (item.menu_id) {
      // Menu item - use order_menu_id
      itemId = (item as any).order_menu_id;
    } else if (item.product_id) {
      // Product item - use order_item_id
      itemId = item.order_item_id;
    } else {
      // Fallback - try all possible IDs
      itemId = item.order_item_id || (item as any).order_product_id || (item as any).order_menu_id;
    }

    if (!itemId) {
      this.toastService.error('Remove Failed', 'Invalid item ID');
      return;
    }

    try {
      const response = await firstValueFrom(
        this.restaurantApi.removeOrderItem(itemId, this.order()!.order_id)
      );

      if (response?.success) {
        // Update order locally first for immediate UI feedback
        const currentOrder = this.order();
        if (currentOrder && currentOrder.items) {
          const updatedItems = currentOrder.items.filter(orderItem => {
            // Check both possible ID fields
            const itemOrderId = orderItem.menu_id ? (orderItem as any).order_menu_id : orderItem.order_item_id;
            return itemOrderId !== itemId;
          });

          // Update the order signal immediately
          this.order.set({
            ...currentOrder,
            items: updatedItems,
            subtotal: updatedItems.reduce((sum, item) => sum + (item.total_price || 0), 0),
            total_amount: updatedItems.reduce((sum, item) => sum + (item.total_price || 0), 0) * 1.28
          });

          this.cdr.detectChanges(); // Force UI update
        }

        // Then reload from server to get accurate totals
        await this.loadOrder();
        this.toastService.success('Item Removed!', `Removed ${item.product_name || item.item_name} from order`);
      } else {
        this.toastService.error('Remove Failed', 'Failed to remove item from order');
      }
    } catch (error) {
      this.toastService.error('Remove Failed', 'Error removing item from order');
    }
  }

  completeOrder(): void {
    // Block completion on non-order tables
    if (!this.order()) {
      this.toastService.error('No Order Found', 'This table does not have an active order to complete');
      return;
    }

    // Block completion on empty orders
    if (!this.order()!.items || this.order()!.items.length === 0) {
      this.toastService.error('Empty Order', 'Cannot complete an order with no items');
      return;
    }

    // Show modal for everyone (for security)
    this.showCompleteModal.set(true);
  }

  closeCompleteModal(): void {
    this.showCompleteModal.set(false);
  }

  cancelOrder(): void {
    // Block cancellation on non-order tables
    if (!this.order()) {
      this.toastService.error('No Order Found', 'This table does not have an active order to cancel');
      return;
    }

    // Show cancel confirmation modal
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
  }

  async confirmCancelOrder(): Promise<void> {
    // Prevent double cancellation
    if (this.isCancelling()) {
      return;
    }

    this.isCancelling.set(true);

    try {
      if (!this.order()) {
        this.toastService.error('No Order Found', 'This table does not have an active order to cancel');
        return;
      }

      const response = await firstValueFrom(this.restaurantApi.cancelOrder(this.order()!.order_id));

      if (response.success) {
        this.toastService.success('Order Cancelled', 'The order has been cancelled successfully');
        this.closeCancelModal();
        // Navigate to dashboard after successful cancellation
        this.router.navigate(['/dashboard']);
      } else {
        this.toastService.error('Error', 'Failed to cancel order');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to cancel order');
    } finally {
      this.isCancelling.set(false);
    }
  }

  async confirmCompleteOrder(goToBilling: boolean = false): Promise<void> {
    // Prevent double completion
    if (this.isCompleting()) {
      return;
    }

    this.isCompleting.set(true);
    this.showCompleteModal.set(false);

    try {

      // 1. Close order 
      const closeResponse = await firstValueFrom(
        this.restaurantApi.closeOrder(this.order()!.order_id, 'cash', this.order()!.total_amount)
      );

      if (!closeResponse?.success) {
        this.toastService.error('Completion Failed', 'Failed to complete order');
        return;
      }

      // 2. Success 
      this.toastService.success('Order Completed!', 'Order completed and bill created with products automatically');

      // Navigate based on user choice
      if (goToBilling && this.authService.isAdmin()) {
        this.router.navigate(['/admin/settings/billing']);
      } else {
        this.router.navigate(['/table', this.tableId]);
      }
    } catch (error) {
      this.toastService.error('Completion Failed', 'Error completing order');
    } finally {
      this.isCompleting.set(false);
    }
  }

  formatPrice(price: any): string {
    if (price === null || price === undefined) {
      return '0.00';
    }

    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);

    if (isNaN(numPrice)) {
      return '0.00';
    }

    return numPrice.toFixed(2);
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'preparing': return 'status-preparing';
      case 'ready': return 'status-ready';
      case 'served': return 'status-served';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  getStatusText(status?: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'served': return 'Served';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Pending';
    }
  }

  goToOrderType(): void {
    this.router.navigate(['/table', this.tableId, 'order-type']);
  }

  goToTable(): void {
    this.router.navigate(['/table', this.tableId]);
  }
}
