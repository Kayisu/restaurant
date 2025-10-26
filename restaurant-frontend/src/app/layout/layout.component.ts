import { Component, ElementRef, HostListener, ViewChild, signal, computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ToastContainerComponent } from './toast-container/toast-container.component';



@Component({
  standalone: true,
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, ToastContainerComponent],
  styleUrl: './layout.component.scss',
  template: `
    <div class="layout">
      <div class="top-actions">
        <!-- USER MENU DROPDOWN - Top Right -->
        <div class="user-menu" #menuRef (click)="toggleMenu()" [class.open]="menuOpen()">
          <div class="user-summary">
            <div class="avatar">
              {{ getUserInitial() }}
            </div>
            <div class="greeting">
              <span>Welcome</span>
              <span>{{ userName() }}</span>
            </div>
          </div>

          <div class="dropdown" *ngIf="menuOpen()">
            <button (click)="goToSettings($event)">
              <svg class="action-icon icon-settings" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              User Settings
            </button>
            <button *ngIf="authService.user()?.role_id === 1" (click)="goToAdminSettings($event)">
              <svg class="action-icon icon-admin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                <path d="M8 12h8"/>
                <path d="M12 8v8"/>
              </svg>
              Admin Settings
            </button>
            <button (click)="logout($event)">
              <svg class="action-icon icon-logout" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <main class="content">
        <router-outlet />
      </main>

      <!-- Toast notifications -->
      <app-toast-container />
    </div>
  `,
})

export class LayoutComponent {
  menuOpen = signal<boolean>(false);

  @ViewChild('menuRef') menuRef!: ElementRef;

  // Computed signals for reactive user data
  userName = computed(() => this.authService.user()?.user_name || 'User');
  userInitial = computed(() => {
    const user = this.authService.user();
    return user?.user_name ? user.user_name.charAt(0).toUpperCase() : 'U';
  });

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  getUserInitial(): string {
    return this.userInitial();
  }

  toggleMenu() {
    this.menuOpen.update(open => !open);
  }

  logout(event: Event) {
    event.stopPropagation();
    this.authService.logout();
    setTimeout(() => {
      this.router.navigate(['/login'], { 
        replaceUrl: true
      });
    }, 100);
  }

  goToSettings(event: Event) {
    event.stopPropagation();
    // Always go to profile customization (user settings)
    this.router.navigate(['/settings']);
    this.menuOpen.set(false);
  }

  goToAdminSettings(event: Event) {
    event.stopPropagation();
    this.router.navigate(['/admin/settings']);
    this.menuOpen.set(false);
  }

  goToBillingManagement(event: Event) {
    event.stopPropagation();
    this.router.navigate(['/admin/settings/billing']);
    this.menuOpen.set(false);
  }


  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    if (!this.menuRef?.nativeElement.contains(event.target)) {
      this.menuOpen.set(false);
    }
  }
}

 
