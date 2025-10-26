import { Component, EventEmitter, Input, Output, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from '../../../core/services/image.service';
import { UploadService, UploadResponse, UploadProgress } from '../../../core/services/upload.service';

export interface ImageUploadConfig {
  type: 'product' | 'menu' | 'category' | 'subcategory';
  variant: 'card' | 'detail';
  multiple?: boolean;
  maxFiles?: number;
  showPreview?: boolean;
  showProgress?: boolean;
}

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./image-upload.component.scss'],
  template: `
    <!-- Global Drag Overlay -->
    <div 
      *ngIf="isDragOver()" 
      class="global-drag-overlay"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)">
      <div class="global-drag-content">
        <div class="global-drag-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="global-drag-title">Drop the image to apply</h2>
        <p class="global-drag-subtitle">Release to upload your image</p>
      </div>
    </div>

    <div class="image-upload-container">
      <!-- Upload Area -->
      <div 
        class="upload-area"
        [class.disabled]="disabled()"
        [class.has-image]="hasImage()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="onClick($event)">
        
        <!-- Image Container -->
        <div class="image-container">
          <!-- Default Placeholder -->
          <div *ngIf="!imageUrl()" class="default-placeholder">
            <!-- Clean placeholder without icon -->
          </div>
        </div>

        <!-- Upload Content -->
        <div class="upload-content">
          <div class="upload-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8.5 13C9.6 13 10.5 12.1 10.5 11C10.5 9.9 9.6 9 8.5 9C7.4 9 6.5 9.9 6.5 11C6.5 12.1 7.4 13 8.5 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="upload-text">Select or drag & drop the image</p>
          <p class="upload-hint">PNG, JPG, WEBP up to 5MB</p>
          
          <!-- Progress Bar -->
          <div *ngIf="uploading()" class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                [style.width.%]="uploadProgress()">
              </div>
            </div>
            <span class="progress-text">{{ uploadProgress() }}%</span>
          </div>
        </div>

        <!-- Hidden File Input -->
        <input 
          type="file" 
          #fileInput
          accept="image/*"
          [disabled]="disabled() || uploading()"
          (change)="onFileSelected($event)"
          style="display: none;">
      </div>

      <!-- Success Message -->
      <div *ngIf="successMessage()" class="success-message">
        <span class="success-icon">✅</span>
        <span class="success-text">{{ successMessage() }}</span>
        <a 
          href="#" 
          class="view-link"
          (click)="viewImage($event)">
          View Image
        </a>
      </div>

      <!-- Error Messages -->
      <div *ngIf="errors().length > 0" class="error-messages">
        <div *ngFor="let error of errors()" class="error-message">
          <span class="error-icon">❌</span>
          <span class="error-text">{{ error }}</span>
        </div>
      </div>
    </div>
  `
})
export class ImageUploadComponent implements OnInit, OnDestroy {
  @Input() config!: ImageUploadConfig;
  @Input() initialImageUrl?: string;
  @Input() variant: 'card' | 'detail' = 'card';
  @Output() imageUploaded = new EventEmitter<UploadResponse>();
  @Output() imageRemoved = new EventEmitter<void>();

  // Signals
  imageUrl = signal<string | null>(null);
  uploading = signal(false);
  uploadProgress = signal(0);
  errors = signal<string[]>([]);
  disabled = signal(false);
  isDragOver = signal(false);
  successMessage = signal<string | null>(null);

  // Computed
  hasImage = signal(false);

  // Properties
  defaultImageUrl = '/default-product.svg';
  recommendedDimensions: { width: number; height: number } | null = null;
  dragConfig: any = {};

  constructor(
    private imageService: ImageService,
    private uploadService: UploadService
  ) {}

  ngOnInit() {
    this.initializeComponent();
    this.setupGlobalDragListeners();
  }

  ngOnDestroy() {
    this.removeGlobalDragListeners();
  }

  private initializeComponent() {
    // Check if config is available
    if (!this.config) {
      return;
    }

    // Set initial image
    if (this.initialImageUrl) {
      this.imageUrl.set(this.initialImageUrl);
      this.hasImage.set(true);
    } else {
      this.defaultImageUrl = this.imageService.generateDefaultImage(this.config.type, this.config.variant);
    }

    // Get recommended dimensions
    this.recommendedDimensions = this.imageService.getRecommendedDimensions(this.config.type, this.config.variant);

    // Configure drag & drop
    this.dragConfig = {
      accept: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxFiles: this.config.multiple ? (this.config.maxFiles || 5) : 1,
      maxSize: 5 * 1024 * 1024, // 5MB
      disabled: false
    };
  }

  private setupGlobalDragListeners() {
    document.addEventListener('dragover', this.handleDocumentDragOver.bind(this));
    document.addEventListener('dragleave', this.handleDocumentDragLeave.bind(this));
    document.addEventListener('drop', this.handleDocumentDrop.bind(this));
  }

  private removeGlobalDragListeners() {
    document.removeEventListener('dragover', this.handleDocumentDragOver.bind(this));
    document.removeEventListener('dragleave', this.handleDocumentDragLeave.bind(this));
    document.removeEventListener('drop', this.handleDocumentDrop.bind(this));
  }

  private handleDocumentDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.items) {
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        if (event.dataTransfer.items[i].kind === 'file') {
          this.isDragOver.set(true);
          break;
        }
      }
    }
  }

  private handleDocumentDragLeave(event: DragEvent) {
    if (!event.relatedTarget || event.relatedTarget === null) {
      this.isDragOver.set(false);
    }
  }

  private handleDocumentDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (this.disabled() || this.uploading()) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  onClick(event: Event) {
    if (this.disabled() || this.uploading()) return;
    
    const target = event.currentTarget as HTMLElement;
    const fileInput = target.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(input.files);
    }
  }

  private handleFiles(files: FileList) {
    if (files.length === 0) return;

    // Clear previous errors
    this.errors.set([]);
    this.successMessage.set(null);

    // Take the first file for single upload
    const file = files[0];
    this.uploadImage(file);
  }

  private async uploadImage(file: File) {
    try {
      // Validate file
      const validation = this.uploadService.validateFile(file);
      if (!validation.valid) {
        this.errors.set([validation.error!]);
        return;
      }

      // Resize image to recommended dimensions
      if (!this.recommendedDimensions) {
        // Use original file if dimensions not available
        this.uploadImageDirectly(file);
        return;
      }

      const resizedFile = await this.imageService.resizeImage(
        file, 
        this.recommendedDimensions.width, 
        this.recommendedDimensions.height
      );

      // Upload to server with progress tracking
      this.uploadImageDirectly(resizedFile);
    } catch (error: any) {
      this.errors.set(['Failed to process image. Please try again.']);
      this.uploading.set(false);
      this.uploadProgress.set(0);
    }
  }

  private uploadImageDirectly(file: File): void {
    this.uploading.set(true);
    this.uploadProgress.set(0);

    this.uploadService.uploadImage(file, (progress: UploadProgress) => {
      this.uploadProgress.set(progress.percentage);
    }).subscribe({
      next: (response: UploadResponse) => {
        if (response) {
          // Set preview URL
          this.imageUrl.set(response.data.imageUrl);
          this.hasImage.set(true);
          
          // Emit the upload response
          this.imageUploaded.emit(response);
          
          this.successMessage.set('Image uploaded successfully!');
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage.set(null);
          }, 3000);
        }
      },
      error: (error) => {
        this.errors.set(['Failed to upload image. Please try again.']);
      },
      complete: () => {
        this.uploading.set(false);
        this.uploadProgress.set(0);
      }
    });
  }

  removeImage() {
    if (this.imageUrl()) {
      URL.revokeObjectURL(this.imageUrl()!);
      this.imageUrl.set(null);
      this.hasImage.set(false);
      this.imageRemoved.emit();
      this.errors.set([]);
      this.successMessage.set(null);
    }
  }

  viewImage(event: Event) {
    event.preventDefault();
    const imageUrl = this.imageUrl();
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  }

  setDisabled(disabled: boolean) {
    this.disabled.set(disabled);
    this.dragConfig.disabled = disabled;
  }
}
