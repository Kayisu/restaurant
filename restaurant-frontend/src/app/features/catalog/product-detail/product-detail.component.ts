import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { ToastService } from '../../../core/services/toast.service';
import { RestaurantApiService } from '../../../core/services/restaurant-api.service';
import { Product, CreateOrderRequest, ApiResponse, Order } from '../../../shared/interfaces';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="product-detail-container">
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
          <span class="breadcrumb-item clickable" (click)="goToProducts()">{{ subcategoryName }}</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item active">{{ productName }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading product details...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-state">
        <p>{{ error() }}</p>
        <button class="btn-primary" (click)="loadProduct()">Try Again</button>
      </div>

      <!-- Product Detail -->
      <div *ngIf="!loading() && !error() && product()" class="product-detail">
        <div class="product-main">
          <div class="product-image-section">
            <img 
              *ngIf="getProductImage()" 
              [src]="getProductImage()" 
              alt="{{ product()?.name }}"
              class="product-image"
            />
            <div *ngIf="!getProductImage()" class="no-image">
              <p>No image available</p>
            </div>
          </div>

          <div class="product-info">
            <div class="product-header">
              <h2>{{ product()?.name }}</h2>
                             <div class="product-price">₺{{ formatPrice(product()?.price) }}</div>
            </div>

            <div class="product-description" *ngIf="product()?.description">
              <p>{{ product()?.description }}</p>
            </div>

            <div class="product-meta">
              <div class="meta-item" *ngIf="product()?.preparation_time">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                <span class="meta-text">Preparation Time: {{ product()?.preparation_time }} minutes</span>
              </div>
            </div>

            <!-- Product Price -->
            <div class="product-price-display">
              <span class="price-label">Price:</span>
              <span class="price-amount">₺{{ formatPrice(product()?.price) }}</span>
            </div>

            <!-- Action Buttons -->
            <div class="product-actions">
              <button class="btn-primary" (click)="addToOrder()">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Add to Order
              </button>
              <button class="btn-secondary" (click)="goToProducts()">
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 12H5"/>
                  <path d="M12 19l-7-7 7-7"/>
                </svg>
                Back to Products
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && !error() && !product()" class="empty-state">
        <p>Product not found</p>
      </div>
    </div>
  `,
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  tableId = '';
  categorySlug = '';
  subcategorySlug = '';
  productSlug = '';
  categoryName = '';
  subcategoryName = '';
  productName = '';
  productId = '';
  product = signal<Product | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Make Math available in template
  Math = Math;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private toastService: ToastService,
    private restaurantApi: RestaurantApiService
  ) {}

  ngOnInit(): void {
    this.tableId = this.route.snapshot.paramMap.get('tableId') || '';
    this.categorySlug = this.route.snapshot.paramMap.get('categorySlug') || '';
    this.subcategorySlug = this.route.snapshot.paramMap.get('subcategorySlug') || '';
    this.productSlug = this.route.snapshot.paramMap.get('productSlug') || '';
    this.productId = this.route.snapshot.paramMap.get('productId') || '';
    
    // If we have productId directly, use that instead of slug-based lookup
    if (this.productId) {
      this.loadProductById();
    } else {
      // Extract names from slugs for display
      this.categoryName = this.slugToName(this.categorySlug);
      this.subcategoryName = this.slugToName(this.subcategorySlug);
      this.productName = this.slugToName(this.productSlug);
      
      this.loadProduct();
    }
  }

  async loadProductById(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Get all active products and find the one with matching product_id
      const response = await this.catalogService.getActiveProducts().toPromise();
      if (response?.success && response?.data) {
        const product = response.data.find(prod => prod.product_id === this.productId);
        
        if (product) {
          this.productName = product.name;
          this.categoryName = product.category_name || 'Unknown Category';
          this.subcategoryName = product.subcategory_name || 'Unknown Subcategory';
          
          this.product.set(product);
        } else {
          this.error.set('Product not found');
        }
      } else {
        this.error.set('Failed to load products');
      }
    } catch (err: any) {
      this.error.set('Failed to load product. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadProduct(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // First, we need to get the product ID from the slugs
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
              this.subcategoryName = subcategory.name;
              
              // Get products for this subcategory
              const productsResponse = await this.catalogService.getSubcategoryProducts(subcategory.subcategory_id).toPromise();
              if (productsResponse?.success && productsResponse?.data) {
                const product = productsResponse.data.find(prod => 
                  this.createSlug(prod.name) === this.productSlug
                );
                
                if (product) {
                  this.productId = product.product_id;
                  this.productName = product.name;
                  
                  this.product.set(product);
                } else {
                  this.error.set('Product not found');
                }
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
      this.error.set('Failed to load product. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }


  async addToOrder(): Promise<void> {
    const productName = this.product()?.name || 'Product';
    const productId = String(this.product()?.product_id || '');
    
    try {
      // 1. First check if table has an active order
      let activeOrder: Order | null = null;
      try {
        const activeOrderResponse = await firstValueFrom(
          this.restaurantApi.getActiveTableOrder(this.tableId)
        );
        if (activeOrderResponse?.success && activeOrderResponse.data) {
          activeOrder = activeOrderResponse.data;
        }
      } catch (error) {
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

      // 3. Check if the same product already exists in the order
      const existingItem = activeOrder.items?.find(item => 
        item.product_id === productId && !item.menu_id
      );

      if (existingItem) {
        // If same product exists, increase quantity
        const newQuantity = existingItem.quantity + 1;
        
        // Update quantity using the existing item's order_item_id
        const updateResponse = await firstValueFrom(
          this.restaurantApi.updateOrderItem(existingItem.order_item_id, {
            quantity: newQuantity,
            order_id: activeOrder.order_id
          })
        );

        if (updateResponse?.success) {
          this.toastService.success('Quantity Updated! 🛒', `${productName} quantity increased to ${newQuantity}`);
        } else {
          throw new Error('Failed to update product quantity');
        }
      } else {
        // If same product doesn't exist, add new one
        const addProductResponse = await firstValueFrom(
          this.restaurantApi.addProductToOrder(
            activeOrder.order_id,
            productId,
            1
          )
        );

        if (addProductResponse?.success) {
          this.toastService.success('Added to Order! 🛒', `${productName} has been added to your order.`);
        } else {
          throw new Error(addProductResponse?.message || 'Failed to add product to order');
        }
      }
      
      // Navigate to current order view to see the updated order
      this.router.navigate(['/table', this.tableId, 'current-order']);
      
    } catch (error) {
      this.toastService.error('Error', 'Failed to add product to order. Please try again.');
    }
  }

  goToProducts(): void {
    // If we came from search (no slugs), navigate to the product's actual category/subcategory
    if (!this.categorySlug || !this.subcategorySlug) {
      const product = this.product();
      if (product && product.category_name && product.subcategory_name) {
        const categorySlug = this.createSlug(product.category_name);
        const subcategorySlug = this.createSlug(product.subcategory_name);
        this.router.navigate(['/table', this.tableId, 'categories', categorySlug, subcategorySlug]);
      } else {
        // Fallback to order type if no category info
        this.router.navigate(['/table', this.tableId, 'order-type']);
      }
    } else {
      // If we came from category navigation, go back to products page
      this.router.navigate(['/table', this.tableId, 'categories', this.categorySlug, this.subcategorySlug]);
    }
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

  // Helper methods for price formatting
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

  getProductImage(): string | null {
    const product = this.product();
    if (!product) return null;

    // First try to use processed images (detail version)
    if (product.processedImages && product.processedImages.detail) {
      // Check if URL is already complete or just filename
      const detailUrl = product.processedImages.detail.url;
      if (detailUrl.startsWith('http')) {
        return detailUrl;
      } else {
        // Add base URL if it's just a filename
        return `http://localhost:5001${detailUrl}`;
      }
    }

    // Fallback to original image_url
    return product.image_url || null;
  }

}
