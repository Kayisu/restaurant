import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantApiService } from '../../../core/services/restaurant-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';

interface Menu {
  menu_id: number;
  menu_name: string;
  description?: string;
  price: number;
  image_url?: string;
  preparation_time?: number;
  item_count: number;
  category_name?: string;
  is_available: boolean;
}

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="menus-container">
      <!-- Header -->
      <div class="catalog-header">
        <div class="breadcrumb">
          <span class="breadcrumb-item clickable" (click)="goToTable()">Table {{ tableId }}</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item clickable" (click)="goToOrderType()">Order Type</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item active">Menus</span>
        </div>
        <h1>Available Menus</h1>
        <p>Choose from our curated menu packages</p>
      </div>


      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading menus...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-state">
        <p>{{ error() }}</p>
        <button class="btn-primary" (click)="loadMenus()">Try Again</button>
      </div>

      <!-- Menus Grid -->
      <div *ngIf="!loading() && !error() && menus().length > 0" class="menus-grid">
        <div 
          *ngFor="let menu of menus()" 
          class="menu-card"
          (click)="selectMenu(menu)"
        >
          <div class="menu-image">
            <img 
              *ngIf="menu.image_url" 
              [src]="menu.image_url" 
              [alt]="menu.menu_name"
              (error)="onImageError($event)"
            />
            <div *ngIf="!menu.image_url" class="menu-placeholder">
              No Image
            </div>
          </div>
          <div class="menu-content">
            <h3>{{ menu.menu_name }}</h3>
            <p *ngIf="menu.description" class="menu-description">{{ menu.description }}</p>
            <div class="menu-price">₺{{ formatPrice(menu.price) }}</div>
            <div class="menu-meta">
              <span *ngIf="menu.preparation_time" class="prep-time">
                <svg class="prep-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                {{ menu.preparation_time }} min
              </span>
              <span class="item-count">
                <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
                {{ menu.item_count }} items
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && !error() && menus().length === 0" class="empty-state">
        <p>No menus available at the moment</p>
      </div>

      <!-- Back Button -->
      <div class="catalog-actions">
        <button class="btn-secondary" (click)="goToOrderType()">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          Back to Order Type
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./menus.component.scss']
})
export class MenusComponent implements OnInit {
  tableId = '';
  menus = signal<Menu[]>([]);
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
    this.loadMenus();
  }

  async loadMenus(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(this.restaurantApi.getMenus());
      
      if (response?.success && Array.isArray(response.data)) {
        this.menus.set(response.data);
      } else {
        this.error.set('Failed to load menus');
      }
    } catch (error) {
      this.error.set('Error loading menus');
    } finally {
      this.loading.set(false);
    }
  }

  selectMenu(menu: Menu): void {
    this.router.navigate(['/table', this.tableId, 'menus', menu.menu_id]);
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

  goToTable(): void {
    this.router.navigate(['/table', this.tableId]);
  }

  goToOrderType(): void {
    this.router.navigate(['/table', this.tableId, 'order-type']);
  }
}
