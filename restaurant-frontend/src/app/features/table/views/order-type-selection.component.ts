import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../shared/interfaces';

@Component({
  standalone: true,
  selector: 'app-order-type-selection',
  imports: [CommonModule, FormsModule],
  styleUrl: './styles/order-type-selection.component.scss',
  template: `
    <div class="order-type-container">
      <!-- Header Section -->
      <div class="order-type-header">
        <button class="back-btn" (click)="goBack()">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          <span>Back to Orders</span>
        </button>
        
        <div class="breadcrumb">
          <span class="breadcrumb-item clickable" (click)="goToTable()">Table {{ tableId }}</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item active">Order Type</span>
        </div>
        
        <h1>Start New Order for Table {{ tableId }}</h1>
        <p>Choose how you'd like to add items to this order</p>
      </div>

      <!-- Product Search -->
      <div class="product-search-section">
        <div class="search-container">
          <input 
            type="text" 
            class="search-input"
            placeholder="Search products..."
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchChange($event)"
            name="productSearch"
          />
          <button 
            class="search-clear-btn" 
            (click)="clearSearch()"
            *ngIf="searchQuery()"
          >
            <svg class="clear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18"/>
              <path d="M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Search Results -->
        <div *ngIf="searchQuery().trim() && filteredProducts().length > 0" class="search-results">
          <h3>Search Results ({{ filteredProducts().length }})</h3>
          <div class="products-grid">
            <div 
              *ngFor="let product of filteredProducts()" 
              class="product-card"
              (click)="selectProduct(product)"
            >
              <div class="product-image">
                <img 
                  *ngIf="product.image_url" 
                  [src]="product.image_url" 
                  [alt]="product.name"
                  (error)="onImageError($event)"
                />
                <div *ngIf="!product.image_url" class="product-placeholder">
                  <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="12" rx="2"/>
                    <path d="M3 9h18"/>
                    <path d="M3 15h18"/>
                    <path d="M9 3v18"/>
                    <path d="M15 3v18"/>
                  </svg>
                </div>
              </div>
              <div class="product-info">
                <h4>{{ product.name }}</h4>
                <p class="product-price">{{ formatPrice(product.price) }} ₺</p>
                <span class="product-category" *ngIf="product.category_name">{{ product.category_name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div *ngIf="searchQuery().trim() && filteredProducts().length === 0" class="no-results">
          <p>No products found for "{{ searchQuery() }}"</p>
        </div>
      </div>

      <!-- Order Type Options -->
      <div class="order-type-options">
        <div class="option-card" (click)="goToCatalog()">
          <div class="option-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <h3>Add from Catalog</h3>
          <p>Browse individual products and customize your order</p>
          <button class="btn btn-primary">Start Catalog Order</button>
        </div>

        <div class="option-card" (click)="goToMenus()">
          <div class="option-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="12" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M3 15h18"/>
              <path d="M9 3v18"/>
              <path d="M15 3v18"/>
            </svg>
          </div>
          <h3>Add from Menu</h3>
          <p>Choose from our curated menu packages</p>
          <button class="btn btn-primary">Start Menu Order</button>
        </div>
      </div>
    </div>
  `
})
export class OrderTypeSelectionComponent implements OnInit {
  tableId: string = '';
  products = signal<Product[]>([]);
  searchQuery = signal('');
  
  filteredProducts = computed(() => {
    if (!this.searchQuery().trim()) {
      return [];
    }
    
    const query = this.searchQuery().toLowerCase();
    return this.products().filter(product => 
      product.name.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query)) ||
      (product.category_name && product.category_name.toLowerCase().includes(query))
    );
  });
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private catalogService: CatalogService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.tableId = this.route.snapshot.paramMap.get('tableId') || '';
    this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    try {
      const response = await this.catalogService.getActiveProducts().toPromise();
      if (response?.success && response?.data) {
        this.products.set(response.data);
      }
    } catch (err: any) {
    }
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  selectProduct(product: Product): void {
    // Navigate to product detail or add to order
    this.router.navigate(['/table', this.tableId, 'products', product.product_id]);
  }

  onImageError(event: any): void {
    if (event.target && event.target.nextElementSibling) {
      event.target.style.display = 'none';
      event.target.nextElementSibling.style.display = 'block';
    }
  }

  formatPrice(price: any): string {
    if (price === null || price === undefined) {
      return '0.00';
    }
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  }

  goBack(): void {
    this.router.navigate(['/table', this.tableId]);
  }

  goToTable(): void {
    this.router.navigate(['/table', this.tableId]);
  }

  goToCatalog(): void {
    this.router.navigate(['/table', this.tableId, 'categories']);
  }

  goToMenus(): void {
    this.router.navigate(['/table', this.tableId, 'menus']);
  }
}
