import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmationModalData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  showIcon?: boolean;
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible()" (click)="onOverlayClick()">
      <div class="modal-content" [class]="getModalClass()" (click)="$event.stopPropagation()">
        <div class="modal-header" [class]="getHeaderClass()">
          <div class="header-content">
            <div class="header-icon" *ngIf="data.showIcon !== false">
              <svg *ngIf="data.type === 'warning'" class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <svg *ngIf="data.type === 'danger'" class="danger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <svg *ngIf="data.type === 'info'" class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              <svg *ngIf="data.type === 'success'" class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h3 class="modal-title">{{ data.title }}</h3>
          </div>
          <button class="btn-close" (click)="onCancel()" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="modal-message" [innerHTML]="data.message"></div>
        </div>
        
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary" 
            (click)="onCancel()"
            [disabled]="loading()"
          >
            {{ data.cancelText || 'Cancel' }}
          </button>
          <button 
            type="button" 
            class="btn" 
            [class]="getConfirmButtonClass()"
            (click)="onConfirm()"
            [disabled]="loading()"
          >
            <span *ngIf="!loading()">{{ data.confirmText || 'Confirm' }}</span>
            <span *ngIf="loading()">Processing...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent implements OnChanges {
  @Input() data: ConfirmationModalData = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info',
    showIcon: true
  };
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  
  isVisible = signal(false);
  loading = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    // Data change handling if needed
  }

  show() {
    this.isVisible.set(true);
  }

  hide() {
    this.isVisible.set(false);
  }

  setLoading(loading: boolean) {
    this.loading.set(loading);
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
    this.hide();
  }

  onOverlayClick() {
    if (!this.loading()) {
      this.onCancel();
    }
  }

  getModalClass(): string {
    const type = this.data.type || 'info';
    return `modal-${type}`;
  }

  getHeaderClass(): string {
    const type = this.data.type || 'info';
    return `header-${type}`;
  }

  getConfirmButtonClass(): string {
    const type = this.data.type || 'info';
    return `btn-${type}`;
  }
}
