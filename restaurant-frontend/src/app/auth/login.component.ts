import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';


@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  styleUrl: './login.component.scss',
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-container">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            <h1>Restaurant Management</h1>
          </div>
          <p>Sign in to your account</p>
        </div>
        
        <!-- Login form with two-way data binding -->
        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="form-group">
            <label for="user_name">Username</label>
            <input 
              id="user_name"
              [(ngModel)]="credentials.user_name" 
              name="user_name" 
              type="text"
              placeholder="Enter your username" 
              required 
              [disabled]="authService.loading()"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              id="password"
              [(ngModel)]="credentials.password" 
              name="password" 
              type="password" 
              placeholder="Enter your password" 
              required 
              [disabled]="authService.loading()"
            />
          </div>

          <!-- Error message display -->
          <div class="error-message" *ngIf="errorMessage()">
            {{ errorMessage() }}
          </div>

          <!-- Submit button with loading state -->
          <button 
            type="submit" 
            class="login-button"
            [disabled]="authService.loading() || !isFormValid()"
          >
            <span *ngIf="!authService.loading()">Sign In</span>
            <span *ngIf="authService.loading()">Signing in...</span>
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  // User credentials object for form binding
  credentials = {
    user_name: '',
    password: ''
  };

  // Error message signal for reactive display
  errorMessage = signal<string>('');

  constructor(
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Check for logout message from query params and display it
    const message = this.route.snapshot.queryParams['message'];
    if (message) {
      this.errorMessage.set(message);
      // Clear the query params to clean up the URL
      this.router.navigate([], { 
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }
  }

   //Validates if both username and password fields are filled
  
  isFormValid(): boolean {
    return this.credentials.user_name.trim() !== '' && 
           this.credentials.password.trim() !== '';
  }

 
  //Handles login form submission

  onLogin(): void {
    if (!this.isFormValid() || this.authService.loading()) {
      return;
    }

    this.errorMessage.set('');

    this.authService.login(this.credentials.user_name, this.credentials.password).subscribe({
      next: (response) => {
        // Wait for auth service to complete token processing
        setTimeout(() => {
          const isAuth = this.authService.isAuthenticated();
          const user = this.authService.user();
          
          if (isAuth && user) {
            this.router.navigate(['/dashboard']);
          } else {
            // Try one more time with a shorter delay for token processing
            setTimeout(() => {
              const isAuth2 = this.authService.isAuthenticated();
              const user2 = this.authService.user();
              
              if (isAuth2 && user2) {
                this.router.navigate(['/dashboard']);
              } else {
                this.errorMessage.set('Login successful but authentication failed. Please try again.');
              }
            }, 200);
          }
        }, 500);
      },
      error: (error) => {
        // Handle different error types and display appropriate messages
        if (error.error?.message) {
          this.errorMessage.set(error.error.message);
        } else if (error.message) {
          this.errorMessage.set(error.message);
        } else {
          this.errorMessage.set('Invalid credentials. Please try again.');
        }
      }
    });
  }
}
