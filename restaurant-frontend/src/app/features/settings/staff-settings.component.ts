import { Component, OnInit, AfterViewInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmationModalComponent, ConfirmationModalData } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  standalone: true,
  selector: 'app-staff-settings',
  imports: [CommonModule, FormsModule, ConfirmationModalComponent],
  styleUrl: './staff-settings.component.scss',
  template: `
    <div class="settings-container">
      <!-- Back Button -->
      <div class="back-button-container">
        <button class="back-btn" (click)="goBack()">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          <span class="back-text">Return to Dashboard</span>
        </button>
      </div>

      <div class="settings-sections">
        <!-- Profile Information -->
        <div class="settings-section">
          <h2>User Settings</h2>
          
          <div class="setting-item">
            <label for="user_name">Username</label>
            <input 
              id="user_name" 
              type="text" 
              [(ngModel)]="profileForm.user_name"
              placeholder="Enter username"
            />
          </div>
          
          <div class="setting-item">
            <label for="email">Email Address</label>
            <input 
              id="email" 
              type="email" 
              [(ngModel)]="profileForm.email"
              placeholder="yourmail@example.com"
            />
          </div>
          
          <div class="setting-item">
            <label for="phone">Phone Number</label>
            <input 
              id="phone" 
              type="tel" 
              [(ngModel)]="profileForm.phone"
              placeholder="+90 555 123 4567"
            />
          </div>

          <div class="setting-item">
            <label for="profile_current_password">Current Password (Required for Profile Updates)</label>
            <input 
              id="profile_current_password" 
              type="password" 
              [(ngModel)]="profileForm.current_password"
              placeholder="Enter your current password"
            />
          </div>

          <!-- Profile Actions -->
          <div class="section-actions">
            <button 
              class="btn-success" 
              (click)="updateProfile()"
              [disabled]="loading() || !profileForm.current_password"
            >
              <span *ngIf="!profileLoading()">Save Changes</span>
              <span *ngIf="profileLoading()">Saving...</span>
            </button>
            
            <button 
              class="btn-cancel" 
              (click)="resetProfileForm()"
              [disabled]="loading()"
            >
              Reset Form
            </button>
          </div>
        </div>

        <!-- Security Settings -->
        <div class="settings-section">
          <h2>User Password</h2>
          
          <div class="setting-item">
            <label for="current_password">Current Password</label>
            <input 
              id="current_password" 
              type="password" 
              [(ngModel)]="passwordForm.current_password"
              placeholder="Enter current password"
            />
          </div>
          
          <div class="setting-item">
            <label for="new_password">New Password</label>
            <input 
              id="new_password" 
              type="password" 
              [(ngModel)]="passwordForm.new_password"
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          
          <div class="setting-item">
            <label for="confirm_password">Confirm New Password</label>
            <input 
              id="confirm_password" 
              type="password" 
              [(ngModel)]="passwordForm.confirm_password"
              placeholder="Confirm new password"
              [class.error-input]="passwordForm.confirm_password && passwordForm.new_password && passwordForm.confirm_password !== passwordForm.new_password"
            />
          </div>

          <!-- Password Validation Messages -->
          <div class="validation-messages" *ngIf="passwordForm.new_password || passwordForm.confirm_password">
            <div class="validation-message error" *ngIf="passwordForm.new_password && passwordForm.new_password.length < 6">
              <svg class="validation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              New password must be at least 6 characters long
            </div>
            <div class="validation-message error" *ngIf="passwordForm.new_password && passwordForm.current_password && passwordForm.new_password === passwordForm.current_password">
              <svg class="validation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              New password must be different from current password
            </div>
            <div class="validation-message error" *ngIf="passwordForm.confirm_password && passwordForm.new_password && passwordForm.confirm_password !== passwordForm.new_password">
              <svg class="validation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Passwords do not match
            </div>
            <div class="validation-message success" *ngIf="passwordForm.new_password && passwordForm.confirm_password && passwordForm.confirm_password === passwordForm.new_password && passwordForm.new_password.length >= 6 && passwordForm.new_password !== passwordForm.current_password">
              <svg class="validation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Passwords match and are valid
            </div>
          </div>

          <!-- Password Actions -->
          <div class="section-actions">
            <button 
              class="btn-primary" 
              (click)="updatePassword()"
              [disabled]="loading() || !isPasswordFormValid()"
            >
              <span *ngIf="!passwordLoading()">Change Password</span>
              <span *ngIf="passwordLoading()">Changing...</span>
            </button>
            
            <button 
              class="btn-cancel" 
              (click)="resetPasswordForm()"
              [disabled]="loading()"
            >
              Reset Form
            </button>
          </div>

          <!-- Password Form Status -->
          <div class="form-status" *ngIf="passwordForm.current_password || passwordForm.new_password || passwordForm.confirm_password">
            <div class="status-item" [class.valid]="passwordForm.current_password && passwordForm.current_password.length >= 6">
              <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span class="status-text">Current password provided</span>
            </div>
            <div class="status-item" [class.valid]="passwordForm.new_password && passwordForm.new_password.length >= 6">
              <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span class="status-text">New password (min 6 characters)</span>
            </div>
            <div class="status-item" [class.valid]="passwordForm.confirm_password && passwordForm.new_password && passwordForm.confirm_password === passwordForm.new_password">
              <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span class="status-text">Passwords match</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Credential Change Confirmation Modal -->
    <app-confirmation-modal
      #credentialModal
      [data]="credentialChangeModalData"
      (confirm)="confirmCredentialChange()"
      (cancel)="cancelCredentialChange()"
    ></app-confirmation-modal>
  `
})
export class StaffSettingsComponent implements OnInit, AfterViewInit {
  loading = signal<boolean>(false);
  profileLoading = signal<boolean>(false);
  passwordLoading = signal<boolean>(false);
  
  // Credential change detection
  credentialChangeModalData: ConfirmationModalData = {
    title: 'Credential Change Warning',
    message: 'You are about to change your login credentials. This will require you to log in again for security reasons.',
    confirmText: 'Continue',
    cancelText: 'Cancel',
    type: 'warning',
    showIcon: true
  };
  
  pendingCredentialChange = signal<{
    type: 'profile' | 'password';
    data: any;
  } | null>(null);

  // Modal visibility control
  showCredentialModal = signal<boolean>(false);
  
  // ViewChild reference to modal component
  @ViewChild('credentialModal') modalComponent!: ConfirmationModalComponent;

  originalProfileForm = {
    user_name: '',
    email: '',
    phone: '',
    current_password: ''
  };

  profileForm = {
    user_name: '',
    email: '',
    phone: '',
    current_password: ''
  };

  passwordForm = {
    current_password: '',
    new_password: '',
    confirm_password: ''
  };

  constructor(
    public authService: AuthService, 
    private toastService: ToastService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    // Only load username from token initially
    const user = this.authService.user();
    if (user) {
      this.profileForm.user_name = user.user_name || '';
      this.originalProfileForm.user_name = user.user_name || '';
    }
  }

  ngAfterViewInit() {
    // Load profile data after view is fully initialized
    // This ensures all services are ready
    this.loadUserProfileData();
  }

  loadUserProfileData() {
    // Check if user is authenticated before making request
    if (!this.authService.user()) {
      return;
    }

    this.profileLoading.set(true);
    
    // Fetch current user's profile data from backend
    this.authService.getCurrentUserProfile().subscribe({
      next: (response: any) => {
        this.profileLoading.set(false);
        
        if (response && response.data) {
          const profileData = response.data;
          this.profileForm.email = profileData.email || '';
          this.profileForm.phone = profileData.phone || '';
          this.originalProfileForm.email = profileData.email || '';
          this.originalProfileForm.phone = profileData.phone || '';
        }
      },
      error: (error) => {
        this.profileLoading.set(false);
        // Keep empty values if backend call fails
        this.profileForm.email = '';
        this.profileForm.phone = '';
        this.originalProfileForm.email = '';
        this.originalProfileForm.phone = '';
      }
    });
  }


  updateProfile() {
    if (this.profileLoading()) return;

    if (!this.profileForm.current_password || this.profileForm.current_password.length < 6) {
      this.toastService.error('Validation Error! ❌', 'Current password is required for profile updates');
      return;
    }

    // Check if there are any actual changes to profile data
    const hasChanges = this.profileForm.user_name !== this.originalProfileForm.user_name ||
                      this.profileForm.email !== this.originalProfileForm.email ||
                      this.profileForm.phone !== this.originalProfileForm.phone;

    if (!hasChanges) {
      this.toastService.info('No Changes! ℹ️', 'No changes detected to update in your profile');
      this.profileForm.current_password = '';
      return;
    }

    // Check if any credentials are being changed (this requires re-login)
    const isUsernameChanging = this.profileForm.user_name !== this.originalProfileForm.user_name;
    const isEmailChanging = this.profileForm.email !== this.originalProfileForm.email;
    const isPhoneChanging = this.profileForm.phone !== this.originalProfileForm.phone;
    const isAnyCredentialChanging = isUsernameChanging || isEmailChanging || isPhoneChanging;
    
    if (isAnyCredentialChanging) {
      // Show confirmation modal for credential change
      this.pendingCredentialChange.set({
        type: 'profile',
        data: { ...this.profileForm }
      });
      
      this.credentialChangeModalData = {
        title: 'Credential Change Warning',
        message: `You are about to change your login credentials. This will require you to log in again for security reasons.`,
        confirmText: 'Continue',
        cancelText: 'Cancel',
        type: 'warning',
        showIcon: true
      };
      
      // Show the modal
      this.modalComponent.show();
      return;
    }

    // Proceed with normal profile update (no username change)
    this.performProfileUpdate();
  }

  private performProfileUpdate() {
    this.profileLoading.set(true);
    this.loading.set(true);

    // Send only profile fields for profile update (no password mixing)
    const updates: any = {
      user_name: this.profileForm.user_name,
      email: this.profileForm.email || '',
      phone: this.profileForm.phone || '',
      current_password: this.profileForm.current_password
    };

    
    // Use profile endpoint for staff settings
    this.authService.updateOwnCredentials(updates).subscribe({
      next: (response) => {
        this.profileLoading.set(false);
        this.loading.set(false);
        this.profileForm.current_password = '';
        
        // Update original form with new values
        this.originalProfileForm = {
          user_name: this.profileForm.user_name,
          email: this.profileForm.email,
          phone: this.profileForm.phone,
          current_password: ''
        };
        
        // User data will be updated by AuthService automatically
        // No need for manual refresh since AuthService handles it
      },
      error: (error) => {
        this.profileLoading.set(false);
        this.loading.set(false);
        
        // Handle token blacklist error
        if (error.status === 403 && error.error?.message?.includes('invalidated')) {
          this.toastService.error('Session Expired! 🔒', 'Your session has been invalidated. Please login again.');
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          // Show more detailed error information
          const errorMessage = error.error?.message || error.message || 'Failed to update profile';
          const errorDetails = error.error?.details || error.error?.error || '';
          
          
          // Show specific error messages based on status
          if (error.status === 500) {
            this.toastService.error('Server Error! 🔥', 'Backend error occurred. Check console for details.');
          } else if (error.status === 400) {
            this.toastService.error('Validation Error! ⚠️', 'Please check your input data.');
          } else {
            this.toastService.error('Update Failed! ❌', `${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`);
          }
        }
      }
    });
  }

  updatePassword() {
    if (this.passwordLoading()) return;

    // Validate form before proceeding
    if (!this.isPasswordFormValid()) {
      this.toastService.error('Validation Error! ❌', 'Please fill in all password fields correctly');
      return;
    }

    // Check if new password is same as current password
    if (this.passwordForm.new_password === this.passwordForm.current_password) {
      this.toastService.warning('Same Password! ⚠️', 'New password must be different from current password');
      return;
    }

    // Show confirmation modal for password change
    this.pendingCredentialChange.set({
      type: 'password',
      data: { ...this.passwordForm }
    });
    
    this.credentialChangeModalData = {
      title: 'Password Change Warning',
      message: `You are about to change your password.<br><br>
               <strong>⚠️ Important:</strong> Changing your password will require you to log in again for security reasons.`,
      confirmText: 'Continue & Logout',
      cancelText: 'Cancel',
      type: 'warning',
      showIcon: true
    };
    
    // Show the modal
    this.modalComponent.show();
  }

  private performPasswordUpdate() {
    this.passwordLoading.set(true);
    this.loading.set(true);

    const passwordData = {
      current_password: this.passwordForm.current_password,
      new_password: this.passwordForm.new_password
    };


    this.authService.updateOwnCredentials(passwordData).subscribe({
      next: (response) => {
        this.resetPasswordForm();
        this.passwordLoading.set(false);
        this.loading.set(false);
        
        // User data will be updated by AuthService automatically
        // No need for manual refresh since AuthService handles it
      },
      error: (error) => {
        this.passwordLoading.set(false);
        this.loading.set(false);
        
        // Handle token blacklist error
        if (error.status === 403 && error.error?.message?.includes('invalidated')) {
          this.toastService.error('Session Expired! 🔒', 'Your session has been invalidated. Please login again.');
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          // Show more detailed error information
          const errorMessage = error.error?.message || error.message || 'Failed to change password';
          const errorDetails = error.error?.details || error.error?.error || '';
          
          
          this.toastService.error('Password Change Failed! ❌', `${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`);
        }
      }
    });
  }

  isPasswordFormValid(): boolean {
    return !!(this.passwordForm.current_password && this.passwordForm.current_password.length >= 6 &&
              this.passwordForm.new_password && this.passwordForm.new_password.length >= 6 &&
              this.passwordForm.confirm_password && this.passwordForm.new_password === this.passwordForm.confirm_password);
  }

  resetProfileForm() {
    this.profileForm = { ...this.originalProfileForm };
    this.profileForm.current_password = '';
  }

  resetPasswordForm() {
    this.passwordForm = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    };
  }

  goBack(): void {
    // Try to go back to previous page, if no history go to dashboard
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  // Debug method to check token and user data
  debugTokenAndUser(): void {
    
    // Force refresh user data from backend
    this.authService.getCurrentUserProfile().subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.authService.user.set(response.data);
        }
      },
      error: (error) => {
        // Fallback to token data
        const decoded = this.authService.getUserFromToken();
        if (decoded) {
          this.authService.user.set(decoded);
        }
      }
    });
  }

  // Modal confirmation methods
  confirmCredentialChange() {
    const pendingChange = this.pendingCredentialChange();
    if (!pendingChange) return;

    // Hide the modal first
    this.modalComponent.hide();

    if (pendingChange.type === 'profile') {
      this.performProfileUpdateWithLogout();
    } else if (pendingChange.type === 'password') {
      this.performPasswordUpdateWithLogout();
    }
  }

  cancelCredentialChange() {
    this.pendingCredentialChange.set(null);
    this.modalComponent.hide();
    // Don't reset forms - let user keep their changes and try again
  }

  private performProfileUpdateWithLogout() {
    const pendingChange = this.pendingCredentialChange();
    if (!pendingChange || pendingChange.type !== 'profile') return;

    this.profileLoading.set(true);
    this.loading.set(true);

    const updates: any = {
      user_name: pendingChange.data.user_name,
      email: pendingChange.data.email || '',
      phone: pendingChange.data.phone || '',
      current_password: pendingChange.data.current_password
    };


    this.authService.updateOwnCredentials(updates).subscribe({
      next: (response) => {
        this.profileLoading.set(false);
        this.loading.set(false);
        
        // Show success message
        this.toastService.success('Profile Updated! ✨', 'Your profile has been updated. You will be logged out for security reasons.');
        
        // Clear pending change
        this.pendingCredentialChange.set(null);
        
        // Immediate logout and redirect
        this.authService.logout();
        this.router.navigate(['/login'], {
          queryParams: { message: 'Profile updated successfully. Please log in again with your new credentials.' }
        });
      },
      error: (error) => {
        this.profileLoading.set(false);
        this.loading.set(false);
        this.pendingCredentialChange.set(null);
        
        // Handle errors
        if (error.status === 403 && error.error?.message?.includes('invalidated')) {
          this.toastService.error('Session Expired! 🔒', 'Your session has been invalidated. Please login again.');
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          const errorMessage = error.error?.message || error.message || 'Failed to update profile';
          this.toastService.error('Update Failed! ❌', errorMessage);
        }
      }
    });
  }

  private performPasswordUpdateWithLogout() {
    const pendingChange = this.pendingCredentialChange();
    if (!pendingChange || pendingChange.type !== 'password') return;

    this.passwordLoading.set(true);
    this.loading.set(true);

    const passwordData = {
      current_password: pendingChange.data.current_password,
      new_password: pendingChange.data.new_password
    };


    this.authService.updateOwnCredentials(passwordData).subscribe({
      next: (response) => {
        this.passwordLoading.set(false);
        this.loading.set(false);
        
        // Show success message
        this.toastService.success('Password Changed! 🔐', 'Your password has been changed. You will be logged out for security reasons.');
        
        // Clear pending change
        this.pendingCredentialChange.set(null);
        
        // Immediate logout and redirect
        this.authService.logout();
        this.router.navigate(['/login'], {
          queryParams: { message: 'Password changed successfully. Please log in again with your new password.' }
        });
      },
      error: (error) => {
        this.passwordLoading.set(false);
        this.loading.set(false);
        this.pendingCredentialChange.set(null);
        
        // Handle errors
        if (error.status === 403 && error.error?.message?.includes('invalidated')) {
          this.toastService.error('Session Expired! 🔒', 'Your session has been invalidated. Please login again.');
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          const errorMessage = error.error?.message || error.message || 'Failed to change password';
          this.toastService.error('Password Change Failed! ❌', errorMessage);
        }
      }
    });
  }

}
