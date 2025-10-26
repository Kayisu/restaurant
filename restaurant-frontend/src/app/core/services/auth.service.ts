import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, tap } from 'rxjs/operators';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';
import { 
  DecodedToken, 
  LoginRequest, 
  LoginResponse,
  RegisterRequest, 
  UpdateCredentialsRequest, 
  AdminUpdateUserRequest,
  User,
  ApiResponse
} from '../../shared/interfaces';

// Authentication service for user login, registration, and token management
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Reactive signals for authentication state
  isAuthenticated = signal<boolean>(false);
  user = signal<DecodedToken | null>(null);
  loading = signal<boolean>(false);

  private api = environment.apiUrl;

  constructor(private http: HttpClient, private toastService: ToastService) {
    // Check for existing token on service initialization
    // This ensures authentication persists on page refresh
    this.initializeAuth();
  }

  // Initialize authentication state from stored token
  private initializeAuth() {
    const decoded = this.getUserFromToken();
    if (decoded) {
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        // Token expired, clear it
        this.clearAuthData();
        return;
      }
      
      // Token is valid, set authentication state
      this.isAuthenticated.set(true);
      this.user.set(decoded);
    }
  }

  // Check if server is reachable and token is still valid
  async validateTokenWithServer(): Promise<boolean> {
    try {
      const response = await this.http.get(`${this.api}/users/profile`, {
        withCredentials: true
      }).toPromise();
      
      return response && (response as any).success;
    } catch (error) {
      // Server unreachable or token invalid
      this.logout();
      return false;
    }
  }


  // Login user with username and password
  login(user_name: string, password: string) {
    this.loading.set(true);
    const loginData: LoginRequest = { user_name, password };
    const loginRequest = this.http.post<LoginResponse>(`${this.api}/users/login`, loginData, {
      withCredentials: true
    });
    
    return loginRequest.pipe(
      tap((response) => {
        // Check if token is in response data
        if (response.data?.token) {
          // Set token cookie manually if backend doesn't set it
          const token = response.data.token;
          
          // Set cookie without domain for better compatibility
          const cookieValue = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = cookieValue;
        }
        
        // Wait for cookie to be set, then decode token
        setTimeout(() => {
          const decoded = this.getUserFromToken();
          if (decoded) {
            this.isAuthenticated.set(true);
            this.user.set(decoded);
          }
        }, 400);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  // Register new user account
  register(userData: RegisterRequest) {
    return this.http.post<ApiResponse<User>>(`${this.api}/users/register`, userData, {
      withCredentials: true
    });
  }

  // Get all users (admin only)
  getUsers() {
    return this.http.get<ApiResponse<User[]>>(`${this.api}/users`, {
      withCredentials: true
    });
  }

  // Delete user by ID (admin only)
  deleteUser(userId: number | string) {
    return this.http.delete(`${this.api}/users/${userId}`, {
      withCredentials: true
    });
  }

  // Update user data by ID (admin only)
  updateUser(userId: number | string, userData: any) {
    return this.http.put(`${this.api}/users/${userId}`, userData, {
      withCredentials: true
    });
  }

  // Update current user credentials (requires current password)
  updateOwnCredentials(credentialsData: UpdateCredentialsRequest) {
    return this.http.put(`${this.api}/users/profile`, credentialsData, {
      withCredentials: true
    }).pipe(
      tap((response: any) => {
        
        // Check if backend provided updated user data and new token in response
        if (response && response.data) {
          
          // If backend provided a new token, set it directly
          if (response.data.token) {
            const newToken = response.data.token;
            
            // Set the new token in cookie
            const cookieValue = `token=${newToken}; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = cookieValue;
            
          }
          
          // Update user signal with the new user data from backend
          if (response.data.user) {
            const updatedUser = response.data.user;
            this.user.set(updatedUser);
            this.toastService.success('Profile Updated! ✨', `Welcome ${updatedUser.user_name}! Your profile has been updated.`);
          } else {
            // Backend didn't provide user data, use getCurrentUserProfile instead
            this.getCurrentUserProfile().subscribe({
              next: (response: any) => {
                if (response && response.data) {
                  this.user.set(response.data);
                  this.toastService.success('Profile Updated! ✨', `Welcome ${response.data.user_name}! Your profile has been updated.`);
                }
              },
              error: (error) => {
                // Fallback to token data
                const decoded = this.getUserFromToken();
                if (decoded) {
                  this.user.set(decoded);
                }
              }
            });
          }
        } else {
          // No response data, use getCurrentUserProfile instead
          this.getCurrentUserProfile().subscribe({
            next: (response: any) => {
              if (response && response.data) {
                this.user.set(response.data);
                this.toastService.success('Profile Updated! ✨', `Welcome ${response.data.user_name}! Your profile has been updated.`);
              }
            },
            error: (error) => {
              // Fallback to token data
              const decoded = this.getUserFromToken();
              if (decoded) {
                this.user.set(decoded);
              }
            }
          });
        }
      })
    );
  }

  // Update any user credentials (admin only)
  adminUpdateCredentials(userId: number | string, updates: AdminUpdateUserRequest) {
    return this.http.put(`${this.api}/users/${userId}`, updates, {
      withCredentials: true
    });
  }

  // Logout user and clear authentication data
  logout() {
    this.isAuthenticated.set(false);
    this.user.set(null);
    this.clearAuthData();
    
    this.http.post(`${this.api}/users/logout`, {}, {
      withCredentials: true
    }).subscribe({
      next: () => {
      },
      error: (error) => {
      }
    });
  }

  // Clear all authentication data from browser
  private clearAuthData() {
    // Clear cookies
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
  }

//restaurant-frontend/src/app/core/services/auth.service.ts
  // Decode JWT token and get user information
  getUserFromToken(): DecodedToken | null {
    const token = this.getCookie('token');
    if (!token) {
      return null;
    }

    try {
      // Check if token has correct format (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode the payload (second part)
      const payload = atob(parts[1]);
      const decoded = JSON.parse(payload);
      
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Get raw JWT token for HTTP headers
  getRawToken(): string | null {
    const token = this.getCookie('token');
    if (!token) {
      return null;
    }
    return token;
  }


  // Get current user profile data from backend
  getCurrentUserProfile() {
    return this.http.get(`${this.api}/users/profile`, {
      withCredentials: true
    });
  }


  // Get cookie value by name
  private getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    
    for (let c of cookies) {
      const [key, value] = c.trim().split('=');
      if (key === name) {
        return value;
      }
    }
    
    return null;
  }

  // Check if current user is admin
  isAdmin(): boolean {
    const user = this.user();
    return user?.role_id === 1;
  }
}



