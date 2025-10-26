import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  show(p0: string, p1: string, toast: Omit<Toast, 'id'>) {
    const newToast: Toast = {
      ...toast,
      id: this.generateId(),
      duration: toast.duration || 3000
    };

    this.toasts.update(toasts => [...toasts, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      this.remove(newToast.id);
    }, newToast.duration);
  }

  success(title: string, message: string, duration?: number) {
    this.show(title, message, { type: 'success', title, message, duration });
  }

  error(title: string, message: string, duration?: number) {
    this.show(title, message, { type: 'error', title, message, duration });
  }

  info(title: string, message: string, duration?: number) {
    this.show(title, message, { type: 'info', title, message, duration });
  }

  warning(title: string, message: string, duration?: number) {
    this.show(title, message, { type: 'warning', title, message, duration });
  }

  remove(id: string) {
    this.toasts.update(toasts => toasts.filter(toast => toast.id !== id));
  }
}
