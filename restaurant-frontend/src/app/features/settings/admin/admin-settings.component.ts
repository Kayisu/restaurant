import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { UserManagementComponent } from './components/user-managment/user-management.component';
import { TableManagementComponent } from './components/table-managment/table-management.component';
import { CatalogManagementComponent } from './components/catalog-management/catalog-management.component';
import { MenuManagementComponent } from './components/menu-management/menu-management.component';
import { BillingManagementComponent } from './components/billing-managment/billing-management.component';

type SettingsSection = 'user-management' | 'table-management' | 'catalog-management' | 'menu-management' | 'billing-management';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, UserManagementComponent, TableManagementComponent, CatalogManagementComponent, MenuManagementComponent, BillingManagementComponent],
  template: `
    <div class="admin-settings-container">
      <!-- Back Button -->
      <div class="back-button-container">
        <button class="back-btn" (click)="goToDashboard()">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          <span class="back-text">Return to Dashboard</span>
        </button>
      </div>

      <!-- Topbar Navigation -->
      <div class="settings-topbar">
        <div class="topbar-title">
          <h1>Admin Settings</h1>
          <p>Manage users, tables and more configurations</p>
        </div>
        
        <div class="settings-nav">
          <button 
            class="nav-item"
            [class.active]="activeSection() === 'user-management'"
            (click)="navigateTo('/admin/settings/user')">
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span class="tab-text">User Management</span>
          </button>
          <button 
            class="nav-item"
            [class.active]="activeSection() === 'table-management'"
            (click)="navigateTo('/admin/settings/table')">
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="12" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M3 15h18"/>
              <path d="M9 3v18"/>
              <path d="M15 3v18"/>
            </svg>
            <span class="tab-text">Table Management</span>
          </button>
          <button 
            class="nav-item"
            [class.active]="activeSection() === 'catalog-management'"
            (click)="navigateTo('/admin/settings/catalog')">
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span class="tab-text">Catalog Management</span>
          </button>
          <button 
            class="nav-item"
            [class.active]="activeSection() === 'menu-management'"
            (click)="navigateTo('/admin/settings/menu')">
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="12" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M3 15h18"/>
              <path d="M9 3v18"/>
              <path d="M15 3v18"/>
            </svg>
            <span class="tab-text">Menu Management</span>
          </button>
          <button 
            class="nav-item"
            [class.active]="activeSection() === 'billing-management'"
            (click)="navigateTo('/admin/settings/billing')">
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <path d="M16 2v4"/>
              <path d="M8 2v4"/>
              <path d="M3 10h18"/>
            </svg>
            <span class="tab-text">Billing Management</span>
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="settings-content">
        <!-- User Management Section -->
        <div *ngIf="activeSection() === 'user-management'" class="settings-section">
          <app-user-management></app-user-management>
        </div>

        <!-- Table Management Section -->
        <div *ngIf="activeSection() === 'table-management'" class="settings-section">
          <app-table-management></app-table-management>
        </div>

        <!-- Catalog Management Section -->
        <div *ngIf="activeSection() === 'catalog-management'" class="settings-section">
          <app-catalog-management></app-catalog-management>
        </div>

        <!-- Menu Management Section -->
        <div *ngIf="activeSection() === 'menu-management'" class="settings-section">
          <app-menu-management></app-menu-management>
        </div>

        <!-- Billing Management Section -->
        <div *ngIf="activeSection() === 'billing-management'" class="settings-section">
          <app-billing-management></app-billing-management>
        </div>


      </div>
    </div>
  `,
  styleUrls: ['./admin-settings.component.scss']
})
export class AdminSettingsComponent implements OnInit {
  activeSection = signal<SettingsSection>('user-management');

  settingsSections = [
    { value: 'user-management' as SettingsSection, label: 'User Management' },
    { value: 'table-management' as SettingsSection, label: 'Table Management' },
    { value: 'catalog-management' as SettingsSection, label: 'Catalog Management' },
    { value: 'menu-management' as SettingsSection, label: 'Menu Management' },
    { value: 'billing-management' as SettingsSection, label: 'Billing Management' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    // Map URL path to sections for direct routes
    this.route.url.subscribe(segments => {
      const path = segments.map(s => s.path).join('/');
      if (path.includes('user')) {
        this.activeSection.set('user-management');
      } else if (path.includes('table')) {
        this.activeSection.set('table-management');
      } else if (path.includes('catalog')) {
        this.activeSection.set('catalog-management');
      } else if (path.includes('menu')) {
        this.activeSection.set('menu-management');
      } else if (path.includes('billing')) {
        this.activeSection.set('billing-management');
      } else {
        // Default to user management if no specific section
        this.activeSection.set('user-management');
      }
    });
  }

  onSectionChange(section: SettingsSection) {
    this.activeSection.set(section);
  }

  goBack(): void {
    // Try to go back to previous page, if no history go to dashboard
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
