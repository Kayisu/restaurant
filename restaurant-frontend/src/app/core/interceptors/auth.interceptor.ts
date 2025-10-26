import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

// Decode JWT token (simple implementation)
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1]);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// Check if JWT token is expired
function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}

// Authentication interceptor for JWT token and error handling
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  // Get raw token from cookie for HTTP headers
  const token = authService.getRawToken();
  
  // Check if token is expired before making the request
  if (token && isTokenExpired(token)) {
    authService.logout();
    router.navigate(['/login'], { 
      replaceUrl: true,
      queryParams: { message: 'Session expired. Please login again.' }
    });
    return throwError(() => new Error('Token expired'));
  }
  
  // Clone the request and add authorization header if token exists
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return next(authReq).pipe(
      catchError((error) => {
        // Handle 401 Unauthorized responses
        if (error.status === 401) {
          authService.logout();
          router.navigate(['/login'], { 
            replaceUrl: true,
            queryParams: { message: 'Session expired. Please login again.' }
          });
        }
        
        // Handle 403 Forbidden (insufficient permissions or blacklisted token)
        if (error.status === 403) {
          
          // Check if this is a token invalidation error
          if (error.error?.message?.includes('invalidated') || 
              error.error?.message?.includes('blacklisted') ||
              error.error?.message?.includes('Token has been invalidated')) {
            authService.logout();
            router.navigate(['/login'], {
              replaceUrl: true,
              queryParams: { message: 'Your session has been invalidated. Please login again.' }
            });
          } else {
            // Regular permission denied
            router.navigate(['/dashboard'], {
              replaceUrl: true,
              queryParams: { message: 'Access denied. Insufficient permissions.' }
            });
          }
        }
        
        return throwError(() => error);
      })
    );
  } else {
    return next(req).pipe(
      catchError((error) => {
        // Handle 401 Unauthorized responses
        if (error.status === 401) {
          authService.logout();
          router.navigate(['/login'], { 
            replaceUrl: true,
            queryParams: { message: 'Session expired. Please login again.' }
          });
        }
        
        // Handle 403 Forbidden (insufficient permissions or blacklisted token)
        if (error.status === 403) {
          
          // Check if this is a token invalidation error
          if (error.error?.message?.includes('invalidated') || 
              error.error?.message?.includes('blacklisted') ||
              error.error?.message?.includes('Token has been invalidated')) {
            authService.logout();
            router.navigate(['/login'], {
              replaceUrl: true,
              queryParams: { message: 'Your session has been invalidated. Please login again.' }
            });
          } else {
            // Regular permission denied
            router.navigate(['/dashboard'], {
              replaceUrl: true,
              queryParams: { message: 'Access denied. Insufficient permissions.' }
            });
          }
        }
        
        return throwError(() => error);
      })
    );
  }
};
