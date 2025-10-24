import { Injectable } from '@angular/core';

export interface ImageConfig {
  width: number;
  height: number;
  backgroundColor: string;
  textColor: string;
  text: string;
  fontSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  
  // Default image configurations for different types
  private readonly imageConfigs: Record<string, Record<string, ImageConfig>> = {
    product: {
      card: { width: 300, height: 200, backgroundColor: '#f3f4f6', textColor: '#6b7280', text: '🍽️', fontSize: 48 },
      detail: { width: 400, height: 400, backgroundColor: '#f3f4f6', textColor: '#6b7280', text: '🍽️', fontSize: 64 }
    },
    menu: {
      card: { width: 300, height: 200, backgroundColor: '#fef3c7', textColor: '#d97706', text: '📋', fontSize: 48 },
      detail: { width: 600, height: 400, backgroundColor: '#fef3c7', textColor: '#d97706', text: '📋', fontSize: 80 }
    },
    category: {
      card: { width: 200, height: 150, backgroundColor: '#e0e7ff', textColor: '#6366f1', text: '📂', fontSize: 36 }
    },
    subcategory: {
      card: { width: 200, height: 150, backgroundColor: '#f0fdf4', textColor: '#16a34a', text: '📁', fontSize: 36 }
    }
  };

  // Generate default image as data URL
  generateDefaultImage(type: 'product' | 'menu' | 'category' | 'subcategory', variant: 'card' | 'detail' = 'card'): string {
    const typeConfig = this.imageConfigs[type];
    if (!typeConfig || !typeConfig[variant]) {
      throw new Error(`No configuration found for type: ${type}, variant: ${variant}`);
    }
    const config = typeConfig[variant];
    return this.createImageDataUrl(config);
  }

  // Generate custom default image
  generateCustomImage(config: ImageConfig): string {
    return this.createImageDataUrl(config);
  }

  // Resize and stretch image to fit dimensions
  resizeImage(file: File, targetWidth: number, targetHeight: number, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        if (ctx) {
          // Draw image stretched to fit exact dimensions
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to resize image'));
            }
          }, file.type, quality);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Validate image file
  validateImage(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPG, PNG, and WebP images are allowed' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'Image size must be less than 5MB' };
    }

    return { valid: true };
  }

  // Get recommended dimensions for image type
  getRecommendedDimensions(type: 'product' | 'menu' | 'category' | 'subcategory', variant: 'card' | 'detail' = 'card'): { width: number; height: number } {
    const typeConfig = this.imageConfigs[type];
    if (!typeConfig || !typeConfig[variant]) {
      throw new Error(`No configuration found for type: ${type}, variant: ${variant}`);
    }
    const config = typeConfig[variant];
    return { width: config.width, height: config.height };
  }

  // Create image data URL from configuration
  private createImageDataUrl(config: ImageConfig): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    canvas.width = config.width;
    canvas.height = config.height;

    // Fill background
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, config.width, config.height);

    // Add text
    ctx.fillStyle = config.textColor;
    ctx.font = `bold ${config.fontSize || 48}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.text, config.width / 2, config.height / 2);

    return canvas.toDataURL('image/png');
  }

  // Generate placeholder image with text
  generatePlaceholder(text: string, width: number = 300, height: number = 200): string {
    return this.createImageDataUrl({
      width,
      height,
      backgroundColor: '#f3f4f6',
      textColor: '#9ca3af',
      text,
      fontSize: Math.min(width, height) * 0.2
    });
  }
}
