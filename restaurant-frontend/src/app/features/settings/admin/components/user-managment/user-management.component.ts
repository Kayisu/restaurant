import { Component, signal, computed, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { User } from '../../../../../shared/interfaces';
import { ConfirmationModalComponent, ConfirmationModalData } from '../../../../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  template: `
    <div class="user-management-container">
      <!-- Header -->
      <div class="section-header">
        <div class="header-content">
          <h2>
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            User Management
          </h2>
          <p>Manage user accounts and permissions</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="openAddUserModal()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
            Add New User
          </button>
          <button class="btn-secondary" (click)="loadUsers()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-row">
          <div class="filter-group">
            <div class="form-group">
              <label for="roleFilter">Role Filter</label>
              <select 
                id="roleFilter"
                [ngModel]="roleFilter()"
                (ngModelChange)="roleFilter.set($event); applyFilters()"
                class="form-select">
                <option value="">All Roles</option>
                <option value="1">Admin</option>
                <option value="2">Staff</option>
              </select>
            </div>
            <div class="form-group search-group">
              <label for="searchValue">Search Users</label>
              <input
                type="text"
                id="searchValue"
                [ngModel]="searchValue()"
                (ngModelChange)="searchValue.set($event); applyFilters()"
                placeholder="Search by name or email..."
                class="form-input">
            </div>
          </div>
          <div class="filter-actions">
            <button class="btn-secondary" (click)="clearFilters()">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Users Grid -->
      <div class="users-grid" *ngIf="!loadingUsers()">
        <div *ngIf="filteredUsers().length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3>No Users Found</h3>
          <p>No users match your current filters.</p>
          <button class="btn-primary" (click)="clearFilters()">
            Clear Filters
          </button>
        </div>

        <div *ngIf="filteredUsers().length > 0" class="users-container">
          <!-- Admin Users Section -->
          <div class="user-section" *ngIf="adminUsers().length > 0">
            <div class="section-header">
              <h4 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Administrators ({{ adminUsers().length }})
              </h4>
              <div class="section-divider"></div>
            </div>
            <div class="user-cards">
              <div *ngFor="let user of adminUsers()" class="user-card" [class]="getRoleClass(user.role_id)">
                <div class="user-header">
                  <div class="user-info">
                    <h4>{{ user.user_name }}</h4>
                    <span class="role-badge" [class]="getRoleClass(user.role_id)">
                      {{ getRoleName(user.role_id) }}
                    </span>
                  </div>
                  <div class="user-actions">
                    <button class="btn-edit" (click)="openEditUserModal(user)">
                      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                    <button 
                      *ngIf="!isCurrentUser(user)"
                      class="btn-delete" 
                      (click)="openDeleteUserModal(user)"
                    >
                      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
                
                <div class="user-details">
                  <div class="detail-item" *ngIf="user.email">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">{{ user.email }}</span>
                  </div>
                  <div class="detail-item" *ngIf="user.phone">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">{{ user.phone }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">{{ formatDate(user.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Staff Users Section -->
          <div class="user-section" *ngIf="staffUsers().length > 0">
            <div class="section-header">
              <h4 class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Staff ({{ staffUsers().length }})
              </h4>
              <div class="section-divider"></div>
            </div>
            <div class="user-cards">
              <div *ngFor="let user of staffUsers()" class="user-card" [class]="getRoleClass(user.role_id)">
                <div class="user-header">
                  <div class="user-info">
                    <h4>{{ user.user_name }}</h4>
                    <span class="role-badge" [class]="getRoleClass(user.role_id)">
                      {{ getRoleName(user.role_id) }}
                    </span>
                  </div>
                  <div class="user-actions">
                    <button class="btn-edit" (click)="openEditUserModal(user)">
                      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                    <button 
                      *ngIf="!isCurrentUser(user)"
                      class="btn-delete" 
                      (click)="openDeleteUserModal(user)"
                    >
                      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
                
                <div class="user-details">
                  <div class="detail-item" *ngIf="user.email">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">{{ user.email }}</span>
                  </div>
                  <div class="detail-item" *ngIf="user.phone">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">{{ user.phone }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">{{ formatDate(user.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loadingUsers()" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    </div>

    <!-- Add User Modal -->
    <div class="modal-overlay" *ngIf="showAddUserModal()" (click)="closeAddUserModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Add New User</h3>
          <button class="btn-close" (click)="closeAddUserModal()">×</button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="registerUser()" #userForm="ngForm">
            <div class="form-row">
              <div class="form-group">
                <label for="user_name">Username *</label>
                <input
                  type="text"
                  id="user_name"
                  [(ngModel)]="newUser.user_name"
                  name="user_name"
                  required
                  class="form-input"
                  placeholder="Enter username">
              </div>
              <div class="form-group">
                <label for="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  [(ngModel)]="newUser.password"
                  name="password"
                  required
                  class="form-input"
                  placeholder="Enter password">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="email">Email</label>
                <input
                  type="email"
                  id="email"
                  [(ngModel)]="newUser.email"
                  name="email"
                  class="form-input"
                  placeholder="Enter email">
              </div>
              <div class="form-group">
                <label for="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  [(ngModel)]="newUser.phone"
                  name="phone"
                  class="form-input"
                  placeholder="Enter phone">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="role_id">Role *</label>
                <select
                  id="role_id"
                  [(ngModel)]="newUser.role_id"
                  name="role_id"
                  required
                  class="form-select">
                  <option value="">Select Role</option>
                  <option value="1">Admin</option>
                  <option value="2">Staff</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" (click)="closeAddUserModal()">
            Cancel
          </button>
          <button type="button" class="btn-primary" (click)="registerUser()" [disabled]="isRegistering()">
            <svg class="btn-icon" *ngIf="!isRegistering()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
            <svg class="btn-icon" *ngIf="isRegistering()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            {{ isRegistering() ? 'Creating...' : 'Create User' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div class="modal-overlay" *ngIf="showEditUserModal()" (click)="closeEditUserModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Edit User</h3>
          <button class="btn-close" (click)="closeEditUserModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-container">
            <div class="form-row">
              <div class="form-group">
                <label>Username</label>
                <input
                  type="text"
                  [ngModel]="editForm().user_name"
                  (ngModelChange)="updateFormField('user_name', $event)"
                  name="user_name"
                  required
                  class="form-input">
              </div>
              <div class="form-group">
                <label>Role</label>
                <select
                  [ngModel]="editForm().role_id"
                  (ngModelChange)="updateFormField('role_id', $event)"
                  name="role_id"
                  required
                  class="form-select"
                  [disabled]="isCurrentUser(userToEdit())">
                  <option value="1">Admin</option>
                  <option value="2">Staff</option>
                </select>
                <small class="form-help" *ngIf="isCurrentUser(userToEdit())">
                  You cannot change your own role for security reasons
                </small>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Email</label>
                <input
                  type="email"
                  [ngModel]="editForm().email"
                  (ngModelChange)="updateFormField('email', $event)"
                  name="email"
                  class="form-input">
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  [ngModel]="editForm().phone"
                  (ngModelChange)="updateFormField('phone', $event)"
                  name="phone"
                  class="form-input">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>New Password (optional)</label>
                <input
                  type="password"
                  [ngModel]="editForm().password"
                  (ngModelChange)="updateFormField('password', $event)"
                  name="password"
                  class="form-input"
                  placeholder="Leave empty to keep current password">
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" (click)="closeEditUserModal()">
            Cancel
          </button>
          <button type="button" class="btn-success" (click)="updateUser()" [disabled]="isUpdating() || !hasFormChanges()">
            <svg class="btn-icon" *ngIf="!isUpdating()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17,21 17,13 7,13 7,21"/>
              <polyline points="7,3 7,8 15,8"/>
            </svg>
            <svg class="btn-icon" *ngIf="isUpdating()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            {{ isUpdating() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete User Modal -->
    <div class="modal-overlay" *ngIf="showDeleteUserModal()" (click)="closeDeleteUserModal()">
      <div class="modal-content danger-modal" (click)="$event.stopPropagation()">
        <div class="modal-header danger-header">
          <h3>
            <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Delete User
          </h3>
          <button class="btn-close" (click)="closeDeleteUserModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="warning-content">
            <div class="warning-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <p>Are you sure you want to delete user <strong>"{{ userToDelete()?.user_name }}"</strong>?</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" (click)="closeDeleteUserModal()">
            Cancel
          </button>
          <button type="button" class="btn-danger" (click)="deleteUser()" [disabled]="isDeleting()">
            <svg class="btn-icon" *ngIf="!isDeleting()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <svg class="btn-icon" *ngIf="isDeleting()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            {{ isDeleting() ? 'Deleting...' : 'Delete User' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Credential Change Confirmation Modal for Admin Self-Update -->
    <app-confirmation-modal
      #credentialModal
      [data]="credentialChangeModalData"
      (confirm)="confirmCredentialChange()"
      (cancel)="cancelCredentialChange()"
    ></app-confirmation-modal>
  `,
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  // State signals
  loadingUsers = signal(false);
  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  roleFilter = signal<string>('');
  searchValue = signal<string>('');

  // Modal states
  showAddUserModal = signal(false);
  showEditUserModal = signal(false);
  showDeleteUserModal = signal(false);
  isRegistering = signal(false);
  isUpdating = signal(false);
  isDeleting = signal(false);

  // Form data
  newUser = {
    user_name: '',
    password: '',
    email: '',
    phone: '',
    role_id: ''
  };

  editForm = signal({
    user_name: '',
    email: '',
    phone: '',
    role_id: '',
    password: ''
  });

  userToDelete = signal<User | null>(null);
  userToEdit = signal<User | null>(null);

  // Credential change detection for admin self-update
  credentialChangeModalData: ConfirmationModalData = {
    title: 'Credential Change Warning',
    message: 'You are about to change your login credentials. This will require you to log in again for security reasons.',
    confirmText: 'Continue',
    cancelText: 'Cancel',
    type: 'warning',
    showIcon: true
  };
  
  pendingCredentialChange = signal<{
    type: 'username' | 'password';
    originalData: any;
    newData: any;
  } | null>(null);

  // Modal visibility control
  showCredentialModal = signal<boolean>(false);
  
  // ViewChild reference to modal component
  @ViewChild('credentialModal') modalComponent!: ConfirmationModalComponent;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  // Computed signals for role-based filtering
  adminUsers = computed(() => this.filteredUsers().filter(user => user.role_id === 1));
  staffUsers = computed(() => this.filteredUsers().filter(user => user.role_id === 2));

  // Computed signal to check if form has changes
  hasFormChanges = computed(() => {
    const user = this.userToEdit();
    const form = this.editForm();
    if (!user) return false;
    
    return form.user_name !== user.user_name ||
           form.email !== (user.email || '') ||
           form.phone !== (user.phone || '') ||
           form.role_id !== user.role_id.toString() ||
           (form.password && form.password.trim() !== '');
  });

  async loadUsers() {
    this.loadingUsers.set(true);
    try {
      const response = await this.authService.getUsers().toPromise();
      if (response?.success && response?.data) {
        this.users.set(response.data);
        this.applyFilters();
      } else {
        this.toastService.error('Error', 'Failed to load users');
      }
    } catch (error: any) {
      this.toastService.error('Error', error?.error?.message || 'Failed to load users');
    } finally {
      this.loadingUsers.set(false);
    }
  }

  applyFilters() {
    let filtered = this.users();

    // Role filter
    if (this.roleFilter()) {
      filtered = filtered.filter(user => user.role_id.toString() === this.roleFilter());
    }

    // Search filter
    if (this.searchValue()) {
      const searchTerm = this.searchValue().toLowerCase();
      filtered = filtered.filter(user => 
        user.user_name.toLowerCase().includes(searchTerm) ||
        (user.email && user.email.toLowerCase().includes(searchTerm))
      );
    }

    this.filteredUsers.set(filtered);
  }

  clearFilters() {
    this.roleFilter.set('');
    this.searchValue.set('');
    this.applyFilters();
  }

  // Modal methods
  openAddUserModal() {
    this.resetForm();
    this.showAddUserModal.set(true);
  }

  closeAddUserModal() {
    this.showAddUserModal.set(false);
    this.resetForm();
  }

  openEditUserModal(user: User) {
    this.userToEdit.set(user);
    this.editForm.set({
      user_name: user.user_name,
      email: user.email || '',
      phone: user.phone || '',
      role_id: user.role_id.toString(),
      password: ''
    });
    this.showEditUserModal.set(true);
  }

  closeEditUserModal() {
    this.showEditUserModal.set(false);
    this.userToEdit.set(null);
  }

  openDeleteUserModal(user: User) {
    this.userToDelete.set(user);
    this.showDeleteUserModal.set(true);
  }

  closeDeleteUserModal() {
    this.showDeleteUserModal.set(false);
    this.userToDelete.set(null);
  }

  async registerUser() {
    if (!this.newUser.user_name || !this.newUser.password || !this.newUser.role_id) {
      this.toastService.error('Error', 'Please fill in all required fields');
      return;
    }

    this.isRegistering.set(true);
    try {
      const userData = {
        user_name: this.newUser.user_name,
        password: this.newUser.password,
        role_id: parseInt(this.newUser.role_id),
        email: this.newUser.email || undefined,
        phone: this.newUser.phone || undefined
      };

      const response = await this.authService.register(userData).toPromise();
      if (response?.success) {
        this.toastService.success('Success', 'User created successfully');
        this.closeAddUserModal();
        this.loadUsers();
      } else {
        this.toastService.error('Error', response?.message || 'Failed to create user');
      }
    } catch (error: any) {
      // Check for specific error messages
      const errorMessage = error?.error?.message || 'Failed to create user';
      
      if (errorMessage.toLowerCase().includes('username') && errorMessage.toLowerCase().includes('already exists')) {
        this.toastService.error('Username Already Exists! ⚠️', 'A user with this username already exists. Please choose a different username.');
      } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already exists')) {
        this.toastService.error('Email Already Exists! ⚠️', 'A user with this email already exists. Please choose a different email.');
      } else {
        this.toastService.error('Error', errorMessage);
      }
    } finally {
      this.isRegistering.set(false);
    }
  }

  async updateUser() {
    const user = this.userToEdit();
    if (!user) return;

    // Check if admin is trying to change their own role
    const currentUser = this.authService.user();
    const isUpdatingSelf = currentUser && this.getUserId(user) === currentUser.userId;
    const originalRoleId = user.role_id;
    const newRoleId = parseInt(this.editForm().role_id);
    
    if (isUpdatingSelf && originalRoleId !== newRoleId) {
      this.toastService.error('Security Error! 🚫', 'You cannot change your own role for security reasons.');
      return;
    }

    // Check if admin is updating themselves and changing credentials
    if (isUpdatingSelf) {
      const form = this.editForm();
      const isUsernameChanging = form.user_name !== user.user_name;
      const isEmailChanging = form.email !== (user.email || '');
      const isPhoneChanging = form.phone !== (user.phone || '');
      const isPasswordChanging = form.password && form.password.trim() !== '';
      const isAnyCredentialChanging = isUsernameChanging || isEmailChanging || isPhoneChanging || isPasswordChanging;
      
      if (isAnyCredentialChanging) {
        
        // Show confirmation modal for credential change
        this.pendingCredentialChange.set({
          type: 'username', // Generic type for any credential change
          originalData: {
            user_name: user.user_name,
            email: user.email,
            phone: user.phone,
            role_id: user.role_id
          },
          newData: {
            user_name: form.user_name,
            email: form.email,
            phone: form.phone,
            role_id: parseInt(form.role_id),
            password: form.password
          }
        });
        
        // Modal data is already set in component initialization
        
        // Show the modal
        this.modalComponent.show();
        return;
      }
    }

    // Proceed with normal update (no credential changes or not updating self)
    this.performUserUpdate();
  }

  private async performUserUpdate() {
    const user = this.userToEdit();
    if (!user) return;

    this.isUpdating.set(true);
    try {
      const form = this.editForm();
      const updateData = {
        user_name: form.user_name,
        email: form.email === '' ? '' : (form.email || undefined),
        phone: form.phone === '' ? '' : (form.phone || undefined),
        role_id: parseInt(form.role_id),
        password: form.password || undefined
      };
      
      // Admin always uses admin endpoint for all users (including self)
      const response: any = await this.authService.updateUser(this.getUserId(user), updateData).toPromise();

      // Check if admin is updating themselves
      const currentUser = this.authService.user();
      const isUpdatingSelf = currentUser && this.getUserId(user) === currentUser.userId;
      
      if (isUpdatingSelf && response?.data?.user) {
        // Update the current user's data in AuthService
        this.authService.user.set(response.data.user);
        this.toastService.success('Profile Updated! ✨', `Welcome ${response.data.user.user_name}! Your profile has been updated.`);
      } else {
        this.toastService.success('Success', 'User updated successfully');
      }
      
      this.closeEditUserModal();
      this.loadUsers();
      this.cdr.detectChanges();
    } catch (error: any) {
      // Check for specific error messages
      const errorMessage = error?.error?.message || 'Failed to update user';
      
      if (errorMessage.toLowerCase().includes('username') && errorMessage.toLowerCase().includes('already exists')) {
        this.toastService.error('Username Already Exists! ⚠️', 'A user with this username already exists. Please choose a different username.');
      } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already exists')) {
        this.toastService.error('Email Already Exists! ⚠️', 'A user with this email already exists. Please choose a different email.');
      } else {
        this.toastService.error('Error', errorMessage);
      }
    } finally {
      this.isUpdating.set(false);
    }
  }

  async deleteUser() {
    const user = this.userToDelete();
    if (!user) return;

    this.isDeleting.set(true);
    try {
      const response = await this.authService.deleteUser(this.getUserId(user)).toPromise();
      this.toastService.success('Success', 'User deleted successfully');
      this.closeDeleteUserModal();
      this.loadUsers();
    } catch (error: any) {
      this.toastService.error('Error', error?.error?.message || 'Failed to delete user');
    } finally {
      this.isDeleting.set(false);
    }
  }

  resetForm() {
    this.newUser = {
      user_name: '',
      password: '',
      email: '',
      phone: '',
      role_id: ''
    };
  }

  getUserId(user: User): number {
    return (user as any).user_id || (user as any).id;
  }

  getRoleName(roleId: number): string {
    const roles = {
      1: 'Admin',
      2: 'Staff'
    };
    return roles[roleId as keyof typeof roles] || 'Unknown';
  }

  getRoleClass(roleId: number): string {
    const classes = {
      1: 'role-admin',
      2: 'role-staff'
    };
    return classes[roleId as keyof typeof classes] || 'role-unknown';
  }

  isCurrentUser(user: User): boolean {
    const currentUser = this.authService.user();
    return !!(currentUser && this.getUserId(user) === currentUser.userId);
  }


  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('tr-TR');
  }

  // Helper method to update form fields
  updateFormField(field: string, value: any) {
    this.editForm.update(form => ({ ...form, [field]: value }));
  }

  // Modal confirmation methods for credential changes
  confirmCredentialChange() {
    const pendingChange = this.pendingCredentialChange();
    if (!pendingChange) return;

    // Hide the modal first
    this.modalComponent.hide();

    this.performUserUpdateWithLogout();
  }

  cancelCredentialChange() {
    this.pendingCredentialChange.set(null);
    this.modalComponent.hide();
    // Don't reset form - let user keep their changes and try again
  }

  private async performUserUpdateWithLogout() {
    const pendingChange = this.pendingCredentialChange();
    if (!pendingChange) return;

    this.isUpdating.set(true);
    try {
      const updateData = {
        user_name: pendingChange.newData.user_name,
        email: pendingChange.newData.email === '' ? '' : (pendingChange.newData.email || undefined),
        phone: pendingChange.newData.phone === '' ? '' : (pendingChange.newData.phone || undefined),
        role_id: pendingChange.newData.role_id,
        password: pendingChange.newData.password || undefined
      };
      
      // Admin always uses admin endpoint for all users (including self)
      const response: any = await this.authService.updateUser(this.getUserId(this.userToEdit()!), updateData).toPromise();

      // Show success message
      this.toastService.success('Profile Updated! ✨', 'Your profile has been updated. You will be logged out for security reasons.');
      
      // Clear pending change
      this.pendingCredentialChange.set(null);
      
      // Close modal
      this.closeEditUserModal();
      
      // Immediate logout and redirect
      this.authService.logout();
      this.router.navigate(['/login'], {
        queryParams: { message: 'Profile updated successfully. Please log in again with your new credentials.' }
      });
      
    } catch (error: any) {
      // Check for specific error messages
      const errorMessage = error?.error?.message || 'Failed to update user';
      
      if (errorMessage.toLowerCase().includes('username') && errorMessage.toLowerCase().includes('already exists')) {
        this.toastService.error('Username Already Exists! ⚠️', 'A user with this username already exists. Please choose a different username.');
      } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already exists')) {
        this.toastService.error('Email Already Exists! ⚠️', 'A user with this email already exists. Please choose a different email.');
      } else {
        this.toastService.error('Error', errorMessage);
      }
      
      this.pendingCredentialChange.set(null);
    } finally {
      this.isUpdating.set(false);
    }
  }
}
