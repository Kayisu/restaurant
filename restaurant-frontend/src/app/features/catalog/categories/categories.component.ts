import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category } from '../../../shared/interfaces';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="categories-container">
      <!-- Header -->
      <div class="catalog-header">
        <div class="breadcrumb">
          <span class="breadcrumb-item clickable" (click)="goToTable()">Table {{ tableId }}</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item clickable" (click)="goToOrderType()">Order Type</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item active">Categories</span>
        </div>
        <h1>Choose a Category</h1>
        <p>Select a category to browse products</p>
      </div>


      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading categories...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="error-state">
        <p>{{ error() }}</p>
        <button class="btn-primary" (click)="loadCategories()">Try Again</button>
      </div>

      <!-- Categories Grid -->
      <div *ngIf="!loading() && !error() && categories().length > 0" class="categories-grid">
        <div 
          *ngFor="let category of categories()" 
          class="category-card"
          (click)="selectCategory(category)"
        >
          <!-- Category Image -->
          <div class="category-image">
            <img 
              *ngIf="category.image_url" 
              [src]="category.image_url" 
              [alt]="category.name"
              (error)="onImageError($event)"
            />
            <div *ngIf="!category.image_url" class="category-placeholder">
              No Image
            </div>
          </div>
          
          <div class="category-content">
            <h3>{{ category.name }}</h3>
            <p *ngIf="category.description">{{ category.description }}</p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && !error() && categories().length === 0" class="empty-state">
        <p>No categories available</p>
      </div>

      <!-- Back Button -->
      <div class="catalog-actions">
        <button class="btn-secondary" (click)="goBack()">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          Back to Table
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  tableId = '';
  categories = signal<Category[]>([]);
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
    this.loadCategories();
  }

  async loadCategories(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.catalogService.getCategories().toPromise();
      if (response?.success && response?.data) {
        response.data.forEach(cat => {
        });
        this.categories.set(response.data);
      } else {
        this.error.set('Failed to load categories');
      }
    } catch (err: any) {
      this.error.set('Failed to load categories. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  selectCategory(category: Category): void {
    // Create a URL-friendly slug from category name
    const categorySlug = this.createSlug(category.name);
    this.router.navigate(['/table', this.tableId, 'categories', categorySlug]);
  }



  goBack(): void {
    this.router.navigate(['/table', this.tableId]);
  }

  onImageError(event: any): void {
    // Hide the image and show placeholder
    event.target.style.display = 'none';
    const placeholder = event.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
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
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }
}
