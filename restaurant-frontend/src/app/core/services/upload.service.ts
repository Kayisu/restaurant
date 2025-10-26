import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    imageUrl: string;
  };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private apiUrl = `${environment.apiUrl}/upload`;

  constructor(private http: HttpClient) {}

  // Upload single image with progress tracking
  uploadImage(file: File, onProgress?: (progress: UploadProgress) => void): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<UploadResponse>(`${this.apiUrl}/image`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<UploadResponse>) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total || 0,
            percentage: event.total ? Math.round((event.loaded / event.total) * 100) : 0
          };
          
          if (onProgress) {
            onProgress(progress);
          }
          
          return null; // Don't emit progress events
        } else if (event.type === HttpEventType.Response) {
          return event.body!;
        }
        return null;
      }),
      map(response => response as UploadResponse)
    );
  }

  // Get image info by filename
  getImageInfo(filename: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/image/${filename}`);
  }

  // Upload multiple images
  uploadMultipleImages(files: File[], onProgress?: (progress: UploadProgress) => void): Observable<UploadResponse[]> {
    const uploads = files.map(file => this.uploadImage(file, onProgress));
    return new Observable(observer => {
      const results: UploadResponse[] = [];
      let completed = 0;

      uploads.forEach((upload, index) => {
        upload.subscribe({
          next: (response) => {
            if (response) {
              results[index] = response;
              completed++;
              
              if (completed === files.length) {
                observer.next(results);
                observer.complete();
              }
            }
          },
          error: (error) => {
            observer.error(error);
          }
        });
      });
    });
  }

  // Validate file before upload
  validateFile(file: File): { valid: boolean; error?: string } {
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

  // Get full image URL
  getImageUrl(filename: string): string {
    return `${environment.apiUrl}/uploads/${filename}`;
  }
}
