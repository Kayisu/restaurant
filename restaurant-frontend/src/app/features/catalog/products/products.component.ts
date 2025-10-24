import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, Subcategory, Product } from '../../../shared/interfaces';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="products-container">
      <!-- Header -->
      <div class="catalog-header">
        <div class="breadcrumb">
          <span class="breadcrumb-item clickable" (click)="goToTable()">Table {{ tableId }}</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item clickable" (click)="goToOrderType()">Order Type</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item clickable" (click)="goToCategories()">Categories</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item clickable" (click)="goToSubcategories()">{{ categoryName }}</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item active">{{ subcategoryName }}</span>
        </div>
        <h1>{{ subcategoryName }}</h1>
        <p>Browse products in {{ categoryName }} › {{ subcategoryName }}</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading products...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-state">
        <p>{{ error() }}</p>
        <button class="btn-primary" (click)="loadProducts()">Try Again</button>
      </div>

      <!-- Products Grid -->
      <div *ngIf="!loading() && !error() && products().length > 0" class="products-grid">
        <div 
          *ngFor="let product of products()" 
          class="product-card"
          (click)="selectProduct(product)"
        >
          <div class="product-image">
            <img 
              *ngIf="getProductImage(product)" 
              [src]="getProductImage(product)" 
              [alt]="product.name"
              (error)="onImageError($event)"
            />
            <div *ngIf="!getProductImage(product)" class="product-placeholder">
              No Image
            </div>
          </div>
          <div class="product-content">
            <h3>{{ product.name }}</h3>
            <p *ngIf="product.description" class="product-description">{{ product.description }}</p>
                         <div class="product-price">₺{{ formatPrice(product.price) }}</div>
            <div class="product-meta">
              <span *ngIf="product.preparation_time" class="prep-time">
                <svg class="prep-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                {{ product.preparation_time }} min
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && !error() && products().length === 0" class="empty-state">
        <p>No products available in this subcategory</p>
      </div>

      <!-- Back Button -->
      <div class="catalog-actions">
        <button class="btn-secondary" (click)="goToSubcategories()">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          Back to {{ categoryName }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  tableId = '';
  categorySlug = '';
  subcategorySlug = '';
  categoryName = '';
  subcategoryName = '';
  subcategoryId = 0;
  products = signal<Product[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.tableId = this.route.snapshot.paramMap.get('tableId') || '';
    this.categorySlug = this.route.snapshot.paramMap.get('categorySlug') || '';
    this.subcategorySlug = this.route.snapshot.paramMap.get('subcategorySlug') || '';
    
    // Extract names from slugs for display
    this.categoryName = this.slugToName(this.categorySlug);
    this.subcategoryName = this.slugToName(this.subcategorySlug);
    
    this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // First, we need to get the subcategory ID from the slugs
      const categoriesResponse = await this.catalogService.getCategories().toPromise();
      if (categoriesResponse?.success && categoriesResponse?.data) {
        const category = categoriesResponse.data.find(cat => 
          this.createSlug(cat.name) === this.categorySlug
        );
        
        if (category) {
          this.categoryName = category.name;
          
          // Get subcategories for this category
          const subcategoriesResponse = await this.catalogService.getCategorySubcategories(category.category_id).toPromise();
          if (subcategoriesResponse?.success && subcategoriesResponse?.data) {
            const subcategory = subcategoriesResponse.data.find(sub => 
              this.createSlug(sub.name) === this.subcategorySlug
            );
            
            if (subcategory) {
              this.subcategoryId = subcategory.subcategory_id;
              this.subcategoryName = subcategory.name;
              
              // Now load products
              const response = await this.catalogService.getSubcategoryProducts(this.subcategoryId).toPromise();
              if (response?.success && response?.data) {
                this.products.set(response.data);
              } else {
                this.error.set('Failed to load products');
              }
            } else {
              this.error.set('Subcategory not found');
            }
          } else {
            this.error.set('Failed to load subcategories');
          }
        } else {
          this.error.set('Category not found');
        }
      } else {
        this.error.set('Failed to load categories');
      }
    } catch (err: any) {
      this.error.set('Failed to load products. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  selectProduct(product: Product): void {
    const productSlug = this.createSlug(product.name);
    this.router.navigate(['/table', this.tableId, 'categories', this.categorySlug, this.subcategorySlug, productSlug]);
  }

  goToSubcategories(): void {
    this.router.navigate(['/table', this.tableId, 'categories', this.categorySlug]);
  }

  goToCategories(): void {
    this.router.navigate(['/table', this.tableId, 'categories']);
  }

  goToTable(): void {
    this.router.navigate(['/table', this.tableId]);
  }

  goToOrderType(): void {
    this.router.navigate(['/table', this.tableId, 'order-type']);
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
    const placeholder = event.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  // Helper method for price formatting
  formatPrice(price: any): string {
    const numPrice = parseFloat(price) || 0;
    return numPrice.toFixed(2);
  }

  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private slugToName(slug: string): string {
    return slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  getProductImage(product: Product): string | null {
    if (!product) return null;

    // First try to use processed images (card version for list view)
    if (product.processedImages && product.processedImages.card) {
      // Check if URL is already complete or just filename
      const cardUrl = product.processedImages.card.url;
      if (cardUrl.startsWith('http')) {
        return cardUrl;
      } else {
        // Add base URL if it's just a filename
        return `http://localhost:5001${cardUrl}`;
      }
    }

    // Fallback to original image_url
    return product.image_url || null;
  }
}
