import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


 // Login guard that prevents authenticated users from accessing login page
export const loginGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Redirect to dashboard if already authenticated
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
