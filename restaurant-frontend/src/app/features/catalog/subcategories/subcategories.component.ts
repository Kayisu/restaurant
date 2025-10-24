import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, Subcategory } from '../../../shared/interfaces';

@Component({
  selector: 'app-subcategories',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="subcategories-container">
      <!-- Header -->
      <div class="catalog-header">
        <div class="breadcrumb">
          <span class="breadcrumb-item clickable" (click)="goToTable()">Table {{ tableId }}</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item clickable" (click)="goToOrderType()">Order Type</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item clickable" (click)="goToCategories()">Categories</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item active">{{ categoryName }}</span>
        </div>
        <h1>{{ categoryName }}</h1>
        <p>Choose a subcategory to browse products</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading subcategories...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-state">
        <p>{{ error() }}</p>
        <button class="btn-primary" (click)="loadSubcategories()">Try Again</button>
      </div>

      <!-- Subcategories Grid -->
      <div *ngIf="!loading() && !error() && subcategories().length > 0" class="subcategories-grid">
        <div 
          *ngFor="let subcategory of subcategories()" 
          class="subcategory-card"
          (click)="selectSubcategory(subcategory)"
        >
          <!-- Subcategory Image -->
          <div class="subcategory-image">
            <img 
              *ngIf="subcategory.image_url" 
              [src]="subcategory.image_url" 
              [alt]="subcategory.name"
              (error)="onImageError($event)"
            />
            <div *ngIf="!subcategory.image_url" class="subcategory-placeholder">
              <svg class="subcategory-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
          </div>
          
          <div class="subcategory-content">
            <h3>{{ subcategory.name }}</h3>
            <p *ngIf="subcategory.description">{{ subcategory.description }}</p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && !error() && subcategories().length === 0" class="empty-state">
        <p>No subcategories available in this category</p>
      </div>

      <!-- Back Button -->
      <div class="catalog-actions">
        <button class="btn-secondary" (click)="goToCategories()">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          Back to Categories
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./subcategories.component.scss']
})
export class SubcategoriesComponent implements OnInit {
  tableId = '';
  categorySlug = '';
  categoryName = '';
  categoryId = 0;
  subcategories = signal<Subcategory[]>([]);
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
    
    // Extract category name from slug for display
    this.categoryName = this.slugToName(this.categorySlug);
    
    this.loadSubcategories();
  }

  async loadSubcategories(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // First, we need to get the category ID from the slug
      // For now, we'll use a simple approach - you might want to store this in a service
      const categoriesResponse = await this.catalogService.getCategories().toPromise();
      if (categoriesResponse?.success && categoriesResponse?.data) {
        const category = categoriesResponse.data.find(cat => 
          this.createSlug(cat.name) === this.categorySlug
        );
        
        if (category) {
          this.categoryId = category.category_id;
          this.categoryName = category.name;
          
          // Now load subcategories
          const response = await this.catalogService.getCategorySubcategories(this.categoryId).toPromise();
          if (response?.success && response?.data) {
            response.data.forEach(sub => {
            });
            this.subcategories.set(response.data);
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
      this.error.set('Failed to load subcategories. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  selectSubcategory(subcategory: Subcategory): void {
    const subcategorySlug = this.createSlug(subcategory.name);
    this.router.navigate(['/table', this.tableId, 'categories', this.categorySlug, subcategorySlug]);
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

  onImageError(event: any): void {
    // Hide the image and show placeholder
    event.target.style.display = 'none';
    const placeholder = event.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  private slugToName(slug: string): string {
    return slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}
