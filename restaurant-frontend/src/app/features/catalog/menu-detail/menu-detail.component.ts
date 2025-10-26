import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantApiService } from '../../../core/services/restaurant-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';

interface MenuItem {
  menu_item_id: number;
  product_id: number;
  product_name: string;
  product_description?: string;
  product_price: number;
  item_type: string;
  quantity: number;
}

interface Menu {
  menu_id: number;
  menu_name: string;
  description?: string;
  price: number;
  image_url?: string;
  preparation_time?: number;
  items: MenuItem[];
}

@Component({
  selector: 'app-menu-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="menu-detail-container">
      <!-- Header -->
      <div class="catalog-header">
        <div class="breadcrumb">
          <span class="breadcrumb-item" (click)="goToTable()">Table {{ tableId }}</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item" (click)="goToOrderType()">Order Type</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item" (click)="goToMenus()">Menus</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item active">{{ menuName }}</span>
        </div>
        <h1>{{ menuName }}</h1>
        <p>Menu Package Details</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading menu details...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-state">
        <p>{{ error() }}</p>
        <button class="btn-primary" (click)="loadMenu()">Try Again</button>
      </div>

      <!-- Menu Detail -->
      <div *ngIf="!loading() && !error() && menu()" class="menu-detail">
        <div class="menu-main">
          <div class="menu-image-section">
            <div class="menu-image">
              <img 
                *ngIf="menu()?.image_url" 
                [src]="menu()?.image_url" 
                [alt]="menu()?.menu_name"
                (error)="onImageError($event)"
              />
              <div *ngIf="!menu()?.image_url" class="menu-placeholder">
                No Image
              </div>
            </div>
          </div>

          <div class="menu-info">
            <div class="menu-header">
              <h2>{{ menu()?.menu_name }}</h2>
              <div class="menu-price">₺{{ formatPrice(menu()?.price) }}</div>
            </div>

            <div class="menu-description" *ngIf="menu()?.description">
              <p>{{ menu()?.description }}</p>
            </div>

            <div class="menu-meta">
              <div class="meta-item" *ngIf="menu()?.preparation_time">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                <span class="meta-text">Preparation Time: {{ menu()?.preparation_time }} minutes</span>
              </div>
              <div class="meta-item">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
                <span class="meta-text">{{ menu()?.items?.length || 0 }} items included</span>
              </div>
            </div>

            <!-- Menu Items -->
            <div class="menu-items" *ngIf="menu()?.items?.length > 0">
              <h3>Included Items</h3>
              <div class="items-list">
                <div 
                  *ngFor="let item of menu()?.items" 
                  class="item-card"
                >
                  <div class="item-info">
                    <div class="item-text">
                      <span class="item-name">{{ item.product_name }}</span>
                      <span class="item-description" *ngIf="item.product_description">{{ item.product_description }}</span>
                    </div>
                    <span class="item-quantity" *ngIf="item.quantity > 1">× {{ item.quantity }}</span>
                  </div>
                  <div class="item-price">₺{{ formatPrice(item.product_price) }}</div>
                </div>
              </div>
            </div>

            <!-- No Items Available Message -->
            <div class="no-items-message" *ngIf="!menu()?.items?.length && !loading()">
              <p>No items available in this menu.</p>
            </div>

            <!-- Action Buttons -->
            <div class="menu-actions">
              <button class="btn-primary" (click)="addToOrder()">
                Add Menu to Order
              </button>
              <button class="btn-secondary" (click)="goToMenus()">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 12H5"/>
                  <path d="M12 19l-7-7 7-7"/>
                </svg>
                Back to Menus
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && !error() && !menu()" class="empty-state">
        <p>Menu not found</p>
      </div>
    </div>
  `,
  styleUrls: ['./menu-detail.component.scss']
})
export class MenuDetailComponent implements OnInit {
  tableId = '';
  menuId = '';
  menuName = '';
  menu = signal<Menu | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private restaurantApi: RestaurantApiService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.tableId = this.route.snapshot.paramMap.get('tableId') || '';
    this.menuId = this.route.snapshot.paramMap.get('menuId') || '';
    this.loadMenu();
  }

  async loadMenu(): Promise<void> {
    if (!this.menuId) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(this.restaurantApi.getMenuDetails(parseInt(this.menuId)));
      
      if (response?.success && response.data) {
        this.menu.set(response.data);
        this.menuName = response.data.menu_name;
      } else {
        this.error.set('Failed to load menu details');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to load menu details. Please try again.');
      this.error.set('Error loading menu details');
    } finally {
      this.loading.set(false);
    }
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
    event.target.nextElementSibling.style.display = 'block';
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

  async addToOrder(): Promise<void> {
    const menuName = this.menu()?.menu_name || 'Menu';
    const menuId = String(this.menu()?.menu_id || '');
    
    try {
      // 1. First check if table has an active order
      let activeOrder: any = null;
      try {
        const activeOrderResponse = await firstValueFrom(
          this.restaurantApi.getActiveTableOrder(this.tableId)
        );
        if (activeOrderResponse?.success && activeOrderResponse.data) {
          activeOrder = activeOrderResponse.data;
        }
      } catch (error) {
        // No active order found, will create new one - this is normal behavior
      }

      // 2. If no active order, create a new one
      if (!activeOrder) {
        const createOrderResponse = await firstValueFrom(
          this.restaurantApi.createOrder(this.tableId)
        );
        
        if (createOrderResponse?.success && createOrderResponse.data) {
          activeOrder = createOrderResponse.data;
        } else {
          throw new Error('Failed to create new order');
        }
      }

      // 3. Check if the same menu already exists in the order
      const existingItem = activeOrder.items?.find((item: any) => 
        item.menu_id === parseInt(menuId) && item.product_id === undefined
      );

      if (existingItem) {
        // If same menu exists, increase quantity
        const newQuantity = existingItem.quantity + 1;
        
        // Update quantity using the existing item's order_menu_id
        const updateResponse = await firstValueFrom(
          this.restaurantApi.updateOrderItem((existingItem as any).order_menu_id, {
            quantity: newQuantity,
            order_id: activeOrder.order_id
          })
        );

        if (updateResponse?.success) {
          this.toastService.success('Quantity Updated! 🛒', `${menuName} quantity increased to ${newQuantity}`);
        } else {
          throw new Error('Failed to update menu quantity');
        }
      } else {
        // If same menu doesn't exist, add new one
        const addMenuResponse = await firstValueFrom(
          this.restaurantApi.addMenuToOrder(
            activeOrder.order_id,
            menuId,
            1
          )
        );

        if (addMenuResponse?.success) {
          this.toastService.success('Added to Order! 🛒', `${menuName} has been added to your order.`);
        } else {
          throw new Error(addMenuResponse?.message || 'Failed to add menu to order');
        }
      }
      
      // Navigate to current order view to see the updated order
      this.router.navigate(['/table', this.tableId, 'current-order']);
      
    } catch (error) {
      this.toastService.error('Error', 'Failed to add menu to order. Please try again.');
    }
  }

  goToMenus(): void {
    this.router.navigate(['/table', this.tableId, 'menus']);
  }

  goToOrderType(): void {
    this.router.navigate(['/table', this.tableId, 'order-type']);
  }

  goToTable(): void {
    this.router.navigate(['/table', this.tableId]);
  }
}
