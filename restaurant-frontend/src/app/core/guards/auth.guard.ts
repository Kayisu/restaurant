import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Get token from storage
  const tokenUser = authService.getUserFromToken();
  
  // If no token at all, redirect to login
  if (!tokenUser) {
    router.navigate(['/login']);
    return false;
  }

  // Check if token is expired
  if (tokenUser.exp) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (tokenUser.exp < currentTime) {
      authService.logout();
      router.navigate(['/login'], {
        queryParams: { message: 'Session expired. Please login again.' }
      });
      return false;
    }
  }

  // Initialize auth state if not set (for new tabs)
  if (!authService.isAuthenticated() || !authService.user()) {
    authService.isAuthenticated.set(true);
    authService.user.set(tokenUser);
  }

  return true;
};
