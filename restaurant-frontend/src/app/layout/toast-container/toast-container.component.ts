import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-toast-container',
  imports: [CommonModule],
  styleUrl: './toast-container.component.scss',
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="toast toast-{{toast.type}}"
          [class.toast-enter]="true"
        >
          <div class="toast-content">
            <div class="toast-icon">
              @switch (toast.type) {
                @case ('success') { ✅ }
                @case ('error') { ❌ }
                @case ('warning') { ⚠️ }
                @case ('info') { ℹ️ }
              }
            </div>
            <div class="toast-text">
              <div class="toast-title">{{ toast.title }}</div>
              <div class="toast-message">{{ toast.message }}</div>
            </div>
            <button 
              class="toast-close" 
              (click)="toastService.remove(toast.id)"
            >
              ×
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
}
