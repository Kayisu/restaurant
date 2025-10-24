import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Admin guard that protects routes requiring admin privileges
 * Validates authentication and admin role from both user signal and token
 * returns true if user is authenticated and has admin role, false otherwise
 */
export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check if user is authenticated
  if (!authService.isAuthenticated()) {
    authService.logout();
    router.navigate(['/login']);
    return false;
  }

  const user = authService.user();
  const tokenUser = authService.getUserFromToken();
  
  // Double-check both sources
  if (!user || !tokenUser) {
    authService.logout();
    router.navigate(['/login']);
    return false;
  }

  // Check admin role from both sources for security
  const isAdminFromUser = user.role_id === 1;
  const isAdminFromToken = tokenUser.role_id === 1;
  
  if (isAdminFromUser && isAdminFromToken) {
    return true;
  }

  // Redirect to dashboard if not admin
  router.navigate(['/dashboard'], {
    queryParams: { message: 'Access denied. Admin privileges required.' }
  });
  return false;
};
