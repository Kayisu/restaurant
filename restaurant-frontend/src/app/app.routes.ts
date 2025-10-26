import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/staff-settings.component').then(m => m.StaffSettingsComponent)
      },
      {
        path: 'admin',
        redirectTo: 'admin/settings/user',
        pathMatch: 'full'
      },
      {
        path: 'admin/settings',
        redirectTo: 'admin/settings/user',
        pathMatch: 'full'
      },
      {
        path: 'admin/settings/user',
        loadComponent: () => import('./features/settings/admin/admin-settings.component').then(m => m.AdminSettingsComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/settings/table',
        loadComponent: () => import('./features/settings/admin/admin-settings.component').then(m => m.AdminSettingsComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/settings/catalog',
        loadComponent: () => import('./features/settings/admin/admin-settings.component').then(m => m.AdminSettingsComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/settings/menu',
        loadComponent: () => import('./features/settings/admin/admin-settings.component').then(m => m.AdminSettingsComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/settings/billing',
        loadComponent: () => import('./features/settings/admin/admin-settings.component').then(m => m.AdminSettingsComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/settings/billing/edit/:id',
        loadComponent: () => import('./features/settings/admin/components/billing-managment/bill-edit.component').then(m => m.BillEditComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'table/:tableId',
        loadComponent: () => import('./features/table/table-detail.component').then(m => m.TableDetailComponent)
      },
      // Catalog routes with beautiful URLs
      {
        path: 'table/:tableId/categories',
        loadComponent: () => import('./features/catalog/categories/categories.component').then(m => m.CategoriesComponent)
      },
      {
        path: 'table/:tableId/categories/:categorySlug',
        loadComponent: () => import('./features/catalog/subcategories/subcategories.component').then(m => m.SubcategoriesComponent)
      },
      {
        path: 'table/:tableId/categories/:categorySlug/:subcategorySlug',
        loadComponent: () => import('./features/catalog/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'table/:tableId/categories/:categorySlug/:subcategorySlug/:productSlug',
        loadComponent: () => import('./features/catalog/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },
      {
        path: 'table/:tableId/products/:productId',
        loadComponent: () => import('./features/catalog/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },
      // Order management routes
      {
        path: 'table/:tableId/order-type',
        loadComponent: () => import('./features/table/views/order-type-selection.component').then(m => m.OrderTypeSelectionComponent)
      },
      {
        path: 'table/:tableId/menus',
        loadComponent: () => import('./features/catalog/menus/menus.component').then(m => m.MenusComponent)
      },
      {
        path: 'table/:tableId/menus/:menuId',
        loadComponent: () => import('./features/catalog/menu-detail/menu-detail.component').then(m => m.MenuDetailComponent)
      },
      {
        path: 'table/:tableId/current-order',
        loadComponent: () => import('./features/table/views/current-order-view.component').then(m => m.CurrentOrderViewComponent)
      },

      // Reservation routes
      {
        path: 'reservations/create',
        loadComponent: () => import('./features/reservations/create-reservation.component').then(m => m.CreateReservationComponent)
      },
      {
        path: 'reservations/edit/:id',
        loadComponent: () => import('./features/reservations/edit-reservation.component').then(m => m.EditReservationComponent)
      },
      {
        path: 'reservations/:reservationId',
        loadComponent: () => import('./features/reservations/reservation-detail.component').then(m => m.ReservationDetailComponent)
      }
      
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
