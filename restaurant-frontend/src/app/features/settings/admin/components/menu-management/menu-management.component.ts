import { Component, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantApiService } from '../../../../../core/services/restaurant-api.service';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Menu, MenuItem, CreateMenuRequest, UpdateMenuRequest, ImageUploadConfig } from '../../../../../shared/interfaces';
import { firstValueFrom } from 'rxjs';
import { ImageUploadComponent } from '../../../../../shared/components/image-upload/image-upload.component';

// Local interfaces
interface Category {
  category_id: number;
  name: string;
}

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploadComponent],
  templateUrl: './menu-management.component.html',
  styleUrls: ['./menu-management.component.scss'],
})
export class MenuManagementComponent implements OnInit {
  // Data signals
  menus = signal<Menu[]>([]);
  categories = signal<Category[]>([]);
  menuItems = signal<MenuItem[]>([]);
  loading = signal(false);
  loadingMenus = signal(false);
  loadingCategories = signal(false);
  loadingMenuItems = signal(false);

  // UI state signals
  activeTab = signal<'menus'>('menus');
  showMenuEditModal = signal(false);
  showAddMenuItemForm = signal(false);
  editingMenu = signal<Menu | null>(null);
  editingMenuItem = signal<MenuItem | null>(null);
  
  // Confirmation dialog state
  showDeleteConfirmation = signal(false);
  itemToDelete = signal<{type: 'menu' | 'menu-item', item: any} | null>(null);

  // Filter and sort signals
  sortField = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  nameFilter = signal<string>('');
  categoryFilter = signal<number | null>(null);
  statusFilter = signal<string>('');
  priceFilter = signal<number | null>(null);

  // Filtered data
  filteredMenus = signal<Menu[]>([]);

  // Form data
  newMenu = {
    menu_name: '',
    description: '',
    price: 0,
    image_url: ''
  };

  newMenuItem = {
    product_id: 0,
    quantity: 1
  };

  // Products for menu items
  products = signal<any[]>([]);
  loadingProducts = signal(false);

  // Calculated price
  calculatedPrice = signal<number>(0);
  loadingCalculatedPrice = signal(false);

  // Inline price editing
  isEditingPrice = signal(false);
  editingPrice = 0;

  // Image upload configuration
  menuImageConfig: ImageUploadConfig = {
    type: 'menu',
    variant: 'card',
    recommendedDimensions: { width: 400, height: 300 },
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    showPreview: true,
    showProgress: true
  };



  // Cascading dropdowns for menu items
  selectedCategoryId = signal<number | null>(null);
  selectedSubcategoryId = signal<number | null>(null);
  availableSubcategories = signal<any[]>([]);
  availableProducts = signal<any[]>([]);
  allSubcategories = signal<any[]>([]);
  
  // Multi-select products
  selectedProducts = signal<any[]>([]);
  showProductDropdown = signal(false);

  constructor(
    private restaurantApi: RestaurantApiService,
    private catalogService: CatalogService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadMenus();
    this.loadProducts();
    this.loadSubcategories();
    this.applyFiltersAndSort();
  }

  // Tab management
  setActiveTab(tab: 'menus'): void {
    this.activeTab.set(tab);
  }

  // Categories Management
  loadCategories(): void {
    this.loadingCategories.set(true);
    this.catalogService.getCategories().subscribe({
      next: (response: any) => {
        if (response?.success && Array.isArray(response.data)) {
          this.categories.set(response.data);
        }
        this.loadingCategories.set(false);
      },
      error: (error: any) => {
        this.loadingCategories.set(false);
        this.toastService.error('Error', 'Error loading categories');
      }
    });
  }

  // Menus Management
  loadMenus(): void {
    this.loadingMenus.set(true);
    this.restaurantApi.getAllMenus().subscribe({
      next: (response: any) => {
        if (response?.success && Array.isArray(response.data)) {
          this.menus.set(response.data);
          this.applyFiltersAndSort();
        }
        this.loadingMenus.set(false);
      },
      error: (error: any) => {
        this.loadingMenus.set(false);
        this.toastService.error('Error', 'Error loading menus');
      }
    });
  }

  toggleAddMenuForm(): void {
    this.showMenuEditModal.set(!this.showMenuEditModal());
    if (!this.showMenuEditModal()) {
      this.resetMenuForm();
    }
  }

  closeMenuEditModal(): void {
    this.showMenuEditModal.set(false);
    this.editingMenu.set(null);
    this.resetMenuForm();
  }

  resetMenuForm(): void {
    this.newMenu = {
      menu_name: '',
      description: '',
      price: 0,
      image_url: ''
    };
    this.editingMenu.set(null);
    this.menuItems.set([]);
    this.selectedProducts.set([]);
    this.showProductDropdown.set(false);
    this.resetCascadingDropdowns();
  }

  createMenu(): void {
    if (!this.newMenu.menu_name || !this.newMenu.price) {
      this.toastService.error('Error', 'Please fill in all required fields');
      return;
    }

    this.loading.set(true);
    this.restaurantApi.createMenu(this.newMenu).subscribe({
      next: (response: any) => {
        if (response?.success) {
          const newMenuId = response.data?.menu_id;
          if (newMenuId && this.menuItems().length > 0) {
            // Add menu items to the newly created menu
            this.addMenuItemsToNewMenu(newMenuId).then(() => {
              this.toastService.success('Success', 'Menu and all items created successfully');
              this.loadMenus();
              this.toggleAddMenuForm();
              this.loading.set(false);
            }).catch((error) => {
              this.toastService.error('Error', 'Menu created but failed to add some items');
              this.loading.set(false);
            });
          } else {
            this.toastService.success('Success', 'Menu created successfully');
            this.loadMenus();
            this.toggleAddMenuForm();
            this.loading.set(false);
          }
        } else {
          this.toastService.error('Error', 'Failed to create menu');
          this.loading.set(false);
        }
      },
      error: (error: any) => {
        this.toastService.error('Error', 'Error creating menu');
        this.loading.set(false);
      }
    });
  }

  private async addMenuItemsToNewMenu(menuId: number): Promise<void> {
    const items = this.menuItems();
    for (const item of items) {
      await this.restaurantApi.addProductToMenu(menuId, {
        product_id: item.product_id,
        quantity: item.quantity
      }).toPromise();
    }
  }

  editMenu(menu: Menu): void {
    this.editingMenu.set(menu);
    this.newMenu = {
      menu_name: menu.menu_name,
      description: menu.description || '',
      price: menu.price,
      image_url: menu.image_url || ''
    };
    this.showMenuEditModal.set(true);
    // Load menu items when editing
    this.loadMenuItems();
    this.loadCalculatedPrice();
  }

  updateMenu(): void {
    if (!this.editingMenu() || !this.newMenu.menu_name || !this.newMenu.price) {
      this.toastService.error('Error', 'Please fill in all required fields');
      return;
    }

    this.loading.set(true);
    const updateData = {
      menu_name: this.newMenu.menu_name,
      description: this.newMenu.description,
      price: this.newMenu.price,
      image_url: this.newMenu.image_url
    };

    // First update menu details
    this.restaurantApi.updateMenu(this.editingMenu()!.menu_id, updateData).subscribe({
      next: (response: any) => {
        if (response?.success) {
          // Then update menu items
          this.updateMenuItems().then(() => {
            this.toastService.success('Success', 'Menu and all items updated successfully');
            this.loadMenus();
            // Don't reload menu items here as modal will close
            this.toggleAddMenuForm();
            this.loading.set(false);
          }).catch((error) => {
            this.toastService.error('Error', 'Menu updated but failed to update some items');
            this.loading.set(false);
          });
        } else {
          this.toastService.error('Error', 'Failed to update menu');
          this.loading.set(false);
        }
      },
      error: (error: any) => {
        this.toastService.error('Error', 'Error updating menu');
        this.loading.set(false);
      }
    });
  }

  private async updateMenuItems(): Promise<void> {
    try {
      const currentItems = this.menuItems();
      const menuId = this.editingMenu()!.menu_id;
      
      // Get current items from backend to compare
      const backendItems = await this.restaurantApi.getMenuItems(menuId).toPromise();
      
      // Handle different response structures
      let backendItemsList = [];
      if (backendItems?.data && Array.isArray(backendItems.data)) {
        backendItemsList = backendItems.data;
      } else if (backendItems?.data && backendItems.data.items && Array.isArray(backendItems.data.items)) {
        backendItemsList = backendItems.data.items;
      } else if (Array.isArray(backendItems)) {
        backendItemsList = backendItems;
      }
      
      const backendItemIds = backendItemsList.map((item: any) => item.menu_item_id) || [];
      
      // Find items to add (new items with temporary IDs)
      const itemsToAdd = currentItems.filter(item => item.menu_item_id > 1000000000); // Temporary IDs are large numbers
      
      // Find items to update (existing items with different quantities)
      const itemsToUpdate = currentItems.filter(item => 
        item.menu_item_id <= 1000000000 && // Real IDs are smaller
        backendItemIds.includes(item.menu_item_id)
      );
      
      // Find items to remove (backend items not in current items)
      const itemsToRemove = backendItemIds.filter((backendId: number) => 
        !currentItems.some(item => item.menu_item_id === backendId)
      );
      
      // Add new items
      for (const item of itemsToAdd) {
        await this.restaurantApi.addProductToMenu(menuId, {
          product_id: item.product_id,
          quantity: item.quantity
        }).toPromise();
      }
      
      // Update existing items
      for (const item of itemsToUpdate) {
        await this.restaurantApi.updateMenuProductQuantity(menuId, item.product_id, item.quantity).toPromise();
      }
      
      // Remove deleted items
      for (const itemId of itemsToRemove) {
        const item = backendItemsList.find((i: any) => i.menu_item_id === itemId);
        if (item) {
          await this.restaurantApi.removeProductFromMenu(menuId, item.product_id).toPromise();
        }
      }
      
      // Update local menuItems signal with current items (excluding temporary IDs)
      const updatedItems = currentItems.filter(item => item.menu_item_id <= 1000000000);
      this.menuItems.set(updatedItems);
    } catch (error) {
      throw error;
    }
  }

  deleteMenu(menu: Menu): void {
    this.showDeleteConfirmationDialog('menu', menu);
  }

  deleteMenuConfirmed(menu: Menu): void {
    this.loading.set(true);
    this.restaurantApi.deleteMenu(menu.menu_id).subscribe({
      next: (response: any) => {
        if (response?.success) {
          this.toastService.success('Success', 'Menu permanently deleted');
          this.loadMenus();
        } else {
          this.toastService.error('Error', 'Failed to delete menu');
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        
        // Check if it's a specific backend error about bill usage
        if (error?.error?.message) {
          if (error.error.message.includes('Cannot delete menu used in bills')) {
            this.toastService.error('Cannot Delete Menu', 'This menu is being used in bills. Please remove it from bills first.');
          } else if (error.error.message.includes('Cannot delete menu used in orders')) {
            this.toastService.error('Cannot Delete Menu', 'This menu is being used in orders. Please remove it from orders first.');
          } else {
            this.toastService.error('Error', error.error.message || 'Error deleting menu');
          }
        } else {
          this.toastService.error('Error', 'Error deleting menu');
        }
        
        this.loading.set(false);
      }
    });
  }

  toggleMenuStatus(menu: Menu): void {
    this.loading.set(true);
    const updateData = {
      is_available: !menu.is_available
    };

    this.restaurantApi.updateMenu(menu.menu_id, updateData).subscribe({
      next: (response: any) => {
        if (response?.success) {
          this.toastService.success('Success', `Menu ${menu.is_available ? 'deactivated' : 'activated'} successfully`);
          this.loadMenus();
        } else {
          this.toastService.error('Error', 'Failed to update menu status');
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        this.toastService.error('Error', 'Error updating menu status');
        this.loading.set(false);
      }
    });
  }

  // Products Management
  loadProducts(): void {
    this.loadingProducts.set(true);
    this.catalogService.getAllProducts().subscribe({
      next: (response: any) => {
        if (response?.success && Array.isArray(response.data)) {
          this.products.set(response.data);
        }
        this.loadingProducts.set(false);
      },
      error: (error: any) => {
        this.loadingProducts.set(false);
        this.toastService.error('Error', 'Error loading products');
      }
    });
  }

  loadSubcategories(): void {
    this.catalogService.getAllSubcategories().subscribe({
      next: (response: any) => {
        if (response?.success && Array.isArray(response.data)) {
          this.allSubcategories.set(response.data);
        }
      },
      error: (error: any) => {
        this.toastService.error('Error', 'Error loading subcategories');
      }
    });
  }

  // Menu Items Management

  loadMenuItems(): void {
    if (!this.editingMenu()) return;

    this.loadingMenuItems.set(true);
    this.restaurantApi.getMenuItems(this.editingMenu()!.menu_id).subscribe({
      next: (response: any) => {
        if (response?.success && response.data?.items) {
          this.menuItems.set(response.data.items);
          // Recalculate price after menu items are loaded
          setTimeout(() => {
            this.loadCalculatedPrice();
          }, 50);
        } else {
          this.menuItems.set([]);
          // Still try to calculate price (will be 0 if no items)
          setTimeout(() => {
            this.loadCalculatedPrice();
          }, 50);
        }
        this.loadingMenuItems.set(false);
      },
      error: (error: any) => {
        this.loadingMenuItems.set(false);
        this.toastService.error('Error', 'Error loading menu items');
      }
    });
  }

  loadCalculatedPrice(): void {
    this.loadingCalculatedPrice.set(true);
    
    // If editing existing menu, get calculated price from backend
    if (this.editingMenu()) {
      this.restaurantApi.getMenuItemsWithCalculatedPrice(this.editingMenu()!.menu_id).subscribe({
        next: (response: any) => {
          if (response?.success && response.data?.calculated_price !== undefined) {
            this.calculatedPrice.set(response.data.calculated_price);
          } else {
            // Wait a bit for menu items to load, then calculate
            setTimeout(() => {
              const localPrice = this.calculateLocalPrice();
              this.calculatedPrice.set(localPrice);
            }, 100);
          }
          this.loadingCalculatedPrice.set(false);
        },
        error: (error: any) => {
          this.loadingCalculatedPrice.set(false);
          this.toastService.error('Error', 'Error loading calculated price');
        }
      });
    } else {
      // For new menus, calculate locally
      const localPrice = this.calculateLocalPrice();
      this.calculatedPrice.set(localPrice);
      this.loadingCalculatedPrice.set(false);
    }
  }

  toggleAddMenuItemForm(): void {
    this.showAddMenuItemForm.set(!this.showAddMenuItemForm());
    if (!this.showAddMenuItemForm()) {
      this.resetMenuItemForm();
    }
  }

  resetMenuItemForm(): void {
    this.newMenuItem = {
      product_id: 0,
      quantity: 1
    };
    this.editingMenuItem.set(null);
    this.resetCascadingDropdowns();
  }

  resetCascadingDropdowns(): void {
    this.selectedCategoryId.set(null);
    this.selectedSubcategoryId.set(null);
    this.availableSubcategories.set([]);
    this.availableProducts.set([]);
  }

  onCategoryChange(categoryId: number): void {
    this.selectedCategoryId.set(categoryId);
    this.selectedSubcategoryId.set(null);
    this.newMenuItem.product_id = 0;
    
    // Filter subcategories by selected category
    const allSubcategories = this.allSubcategories();
    const filteredSubcategories = allSubcategories.filter((sub: any) => sub.category_id === categoryId);
    this.availableSubcategories.set(filteredSubcategories);
    
    // Clear products
    this.availableProducts.set([]);
  }

  onSubcategoryChange(subcategoryId: number): void {
    this.selectedSubcategoryId.set(subcategoryId);
    this.newMenuItem.product_id = 0;
    
    // Filter products by selected subcategory
    const allProducts = this.products();
    const filteredProducts = allProducts.filter(product => product.subcategory_id === subcategoryId);
    this.availableProducts.set(filteredProducts);
  }

  addMenuItem(): void {
    if (this.selectedProducts().length === 0 || !this.newMenuItem.quantity) {
      this.toastService.error('Error', 'Please select products and enter quantity');
      return;
    }

    // Add products to local menu items - will be saved when Update Menu is clicked
    const currentItems = this.menuItems();
    const updatedItems = [...currentItems];
    
    this.selectedProducts().forEach(product => {
      // Check if product already exists in menu
      const existingItemIndex = updatedItems.findIndex(item => item.product_id === product.product_id);
      
      if (existingItemIndex !== -1) {
        // Product exists, increase quantity
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + this.newMenuItem.quantity
        };
      } else {
        // Product doesn't exist, add new item
        const newItem = {
          menu_item_id: Date.now() + Math.random(), // Temporary ID for local tracking
          menu_id: this.editingMenu()?.menu_id || 0, // Use 0 for new menus
          product_id: product.product_id,
          product_name: product.name,
          product_description: product.description,
          product_price: product.price,
          category_name: product.category_name,
          subcategory_name: product.subcategory_name,
          quantity: this.newMenuItem.quantity
        };
        updatedItems.push(newItem);
      }
    });
    
    this.menuItems.set(updatedItems);
    
    // Clear form and close dropdown
    this.selectedProducts.set([]);
    this.showProductDropdown.set(false);
    this.newMenuItem.quantity = 1;
    this.toggleAddMenuItemForm();
    
    // Recalculate price locally immediately
    const localPrice = this.calculateLocalPrice();
    this.calculatedPrice.set(localPrice);
    
    // For new menus, also update the price field with calculated price
    if (!this.editingMenu()) {
      this.newMenu.price = localPrice;
    }
    
    
    this.toastService.success('Success', `Product(s) added to menu (will be saved when you click ${this.editingMenu() ? 'Update Menu' : 'Create Menu'})`);
  }

  editMenuItem(item: MenuItem): void {
    this.editingMenuItem.set(item);
    this.newMenuItem = {
      product_id: item.product_id,
      quantity: item.quantity
    };
    this.showAddMenuItemForm.set(true);
  }

  increaseQuantity(item: MenuItem): void {
    this.loading.set(true);
    
    const newQuantity = item.quantity + 1;
    
    this.restaurantApi.updateMenuProductQuantity(
      this.editingMenu()!.menu_id, 
      item.product_id, 
      newQuantity
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success('Success', 'Quantity increased successfully');
          this.loadMenuItems();
          this.loadCalculatedPrice();
        } else {
          this.toastService.error('Error', response.message || 'Failed to update quantity');
        }
      },
      error: (error: any) => {
        this.toastService.error('Error', 'Error updating quantity');
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  decreaseQuantity(item: MenuItem): void {
    this.loading.set(true);
    
    const newQuantity = item.quantity - 1;
    
    this.restaurantApi.updateMenuProductQuantity(
      this.editingMenu()!.menu_id, 
      item.product_id, 
      newQuantity
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success('Success', 'Quantity decreased successfully');
          this.loadMenuItems();
          this.loadCalculatedPrice();
        } else {
          this.toastService.error('Error', response.message || 'Failed to update quantity');
        }
      },
      error: (error: any) => {
        this.toastService.error('Error', 'Error updating quantity');
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  updateMenuItem(): void {
    if (!this.editingMenuItem() || !this.newMenuItem.quantity) {
      this.toastService.error('Error', 'Please fill in all required fields');
      return;
    }

    this.loading.set(true);
    this.restaurantApi.updateMenuProductQuantity(
      this.editingMenu()!.menu_id,
      this.editingMenuItem()!.product_id,
      this.newMenuItem.quantity
    ).subscribe({
      next: (response: any) => {
        if (response?.success) {
          this.toastService.success('Success', 'Product quantity updated successfully');
          this.loadMenuItems();
          this.loadCalculatedPrice();
          this.toggleAddMenuItemForm();
          // Force change detection to update UI
          this.cdr.detectChanges();
        } else {
          this.toastService.error('Error', 'Failed to update product quantity');
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        this.toastService.error('Error', 'Error updating product quantity');
        this.loading.set(false);
      }
    });
  }

  // Confirmation dialog methods
  showDeleteConfirmationDialog(type: 'menu' | 'menu-item', item: any): void {
    this.itemToDelete.set({ type, item });
    this.showDeleteConfirmation.set(true);
  }

  hideDeleteConfirmationDialog(): void {
    this.showDeleteConfirmation.set(false);
    this.itemToDelete.set(null);
  }

  confirmDelete(): void {
    const deleteItem = this.itemToDelete();
    if (!deleteItem) return;

    if (deleteItem.type === 'menu') {
      this.deleteMenuConfirmed(deleteItem.item);
    } else if (deleteItem.type === 'menu-item') {
      this.removeMenuItemConfirmed(deleteItem.item);
    }

    this.hideDeleteConfirmationDialog();
  }

  removeMenuItem(item: MenuItem): void {
    // Just remove from local state - will be saved when Update Menu is clicked
    const currentItems = this.menuItems();
    const updatedItems = currentItems.filter(menuItem => menuItem.menu_item_id !== item.menu_item_id);
    this.menuItems.set(updatedItems);
    
    // Recalculate price locally immediately
    const localPrice = this.calculateLocalPrice();
    this.calculatedPrice.set(localPrice);
    
    // For new menus, also update the price field with calculated price
    if (!this.editingMenu()) {
      this.newMenu.price = localPrice;
    }
    
    
    this.toastService.success('Success', 'Product removed from menu (will be saved when you click Update Menu)');
  }

  removeMenuItemConfirmed(item: MenuItem): void {
    // Just remove from local state - will be saved when Update Menu is clicked
    const currentItems = this.menuItems();
    const updatedItems = currentItems.filter(menuItem => menuItem.menu_item_id !== item.menu_item_id);
    this.menuItems.set(updatedItems);
    
    // Recalculate price locally immediately
    const localPrice = this.calculateLocalPrice();
    this.calculatedPrice.set(localPrice);
    
    // For new menus, also update the price field with calculated price
    if (!this.editingMenu()) {
      this.newMenu.price = localPrice;
    }
    
    
    this.toastService.success('Success', 'Product removed from menu (will be saved when you click Update Menu)');
  }

  // Filtering and Sorting
  sortData(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.applyFiltersAndSort();
  }

  getSortIcon(field: string): string {
    if (this.sortField() !== field) return 'sort';
    return this.sortDirection() === 'asc' ? 'sort-asc' : 'sort-desc';
  }

  onNameFilterChange(): void {
    this.applyFiltersAndSort();
  }

  onCategoryFilterChange(): void {
    this.applyFiltersAndSort();
  }

  onStatusFilterChange(): void {
    this.applyFiltersAndSort();
  }

  onPriceFilterChange(): void {
    if (this.priceFilter() !== null && this.priceFilter()! < 0) {
      this.priceFilter.set(0);
    }
    this.applyFiltersAndSort();
  }

  clearFilters(): void {
    this.nameFilter.set('');
    this.categoryFilter.set(null);
    this.statusFilter.set('');
    this.priceFilter.set(null);
    this.sortField.set('');
    this.sortDirection.set('asc');
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    this.filterMenus();
  }

  private filterMenus(): void {
    let filtered = [...this.menus()];

    // Name filter
    if (this.nameFilter()) {
      const term = this.nameFilter().toLowerCase();
      filtered = filtered.filter(menu => 
        menu.menu_name.toLowerCase().includes(term)
      );
    }


    // Status filter
    if (this.statusFilter()) {
      filtered = filtered.filter(menu => 
        this.statusFilter() === 'available' ? menu.is_available : !menu.is_available
      );
    }

    // Price filter
    if (this.priceFilter()) {
      filtered = filtered.filter(menu => 
        menu.price >= this.priceFilter()!
      );
    }

    // Sort
    if (this.sortField()) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (this.sortField()) {
          case 'name':
            aValue = a.menu_name;
            bValue = b.menu_name;
            break;
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'status':
            aValue = a.is_available;
            bValue = b.is_available;
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return this.sortDirection() === 'asc'
            ? aValue.localeCompare(bValue, 'tr-TR')
            : bValue.localeCompare(aValue, 'tr-TR');
        }

        if (aValue < bValue) return this.sortDirection() === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection() === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredMenus.set(filtered);
  }

  // Utility methods
  getCategoryName(categoryId: number): string {
    const category = this.categories().find(c => c.category_id === categoryId);
    return category ? category.name : 'Unknown';
  }

  formatPrice(price: number | string): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  }

  // Inline price editing methods
  startEditPrice(): void {
    if (this.editingMenu()) {
      this.editingPrice = this.editingMenu()!.price;
      this.isEditingPrice.set(true);
      
      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        const input = document.querySelector('.price-input-inline') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
    }
  }

  savePrice(): void {
    if (!this.editingMenu() || this.editingPrice <= 0) {
      this.cancelEditPrice();
      return;
    }

    this.loading.set(true);
    
    const updateData = {
      price: this.editingPrice
    };

    this.restaurantApi.updateMenu(this.editingMenu()!.menu_id, updateData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success('Success', 'Menu price updated successfully');
          
          // Update the selected menu in the menus array
          const updatedMenus = this.menus().map(menu => 
            menu.menu_id === this.editingMenu()!.menu_id 
              ? { ...menu, price: this.editingPrice }
              : menu
          );
          this.menus.set(updatedMenus);
          
          // Update the editing menu
          const updatedEditingMenu = { ...this.editingMenu()!, price: this.editingPrice };
          this.editingMenu.set(updatedEditingMenu);
          
          this.isEditingPrice.set(false);
          this.loadCalculatedPrice();
        } else {
          this.toastService.error('Error', response.message || 'Failed to update menu price');
          this.cancelEditPrice();
        }
      },
      error: (error: any) => {
        this.toastService.error('Error', 'Error updating menu price');
        this.cancelEditPrice();
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  cancelEditPrice(): void {
    this.isEditingPrice.set(false);
    this.editingPrice = 0;
  }

  // Image upload methods
  onMenuImageUploaded(response: any): void {
    // Handle both string and object responses
    const imageUrl = typeof response === 'string' ? response : response?.data?.imageUrl || response?.imageUrl;
    if (imageUrl) {
      this.newMenu.image_url = imageUrl;
      this.toastService.success('Success', 'Menu image uploaded successfully');
    } else {
      this.toastService.error('Error', 'Failed to get image URL');
    }
  }

  onMenuImageRemoved(): void {
    this.newMenu.image_url = '';
    this.toastService.success('Success', 'Menu image removed successfully');
  }


  // Multi-select product methods
  toggleProductDropdown(): void {
    this.showProductDropdown.set(!this.showProductDropdown());
  }

  toggleProductSelection(product: any): void {
    const current = this.selectedProducts();
    const isSelected = this.isProductSelected(product);
    
    if (isSelected) {
      this.selectedProducts.set(current.filter(p => p.product_id !== product.product_id));
    } else {
      this.selectedProducts.set([...current, product]);
    }
    
    // Close dropdown after selection
    this.showProductDropdown.set(false);
  }

  isProductSelected(product: any): boolean {
    return this.selectedProducts().some(p => p.product_id === product.product_id);
  }

  removeProduct(product: any): void {
    const current = this.selectedProducts();
    this.selectedProducts.set(current.filter(p => p.product_id !== product.product_id));
  }

  updateMenuItemQuantity(item: any, newQuantity: number): void {
    if (newQuantity < 1) return;
    
    // Just update local state - will be saved when Update Menu is clicked
    const currentItems = this.menuItems();
    const updatedItems = currentItems.map(menuItem => 
      menuItem.menu_item_id === item.menu_item_id 
        ? { ...menuItem, quantity: newQuantity }
        : menuItem
    );
    this.menuItems.set(updatedItems);
    
    // Recalculate price locally immediately
    const localPrice = this.calculateLocalPrice();
    this.calculatedPrice.set(localPrice);
    
    // For new menus, also update the price field with calculated price
    if (!this.editingMenu()) {
      this.newMenu.price = localPrice;
    }
    
  }

  // Set calculated price as menu price
  setCalculatedPrice(): void {
    if (this.calculatedPrice() > 0) {
      this.newMenu.price = this.calculatedPrice();
      this.toastService.success('Success', 'Menu price set to calculated price');
    }
  }

  // Calculate price locally for new menus
  calculateLocalPrice(): number {
    const items = this.menuItems();
    const total = items.reduce((total, item) => {
      const itemTotal = item.product_price * item.quantity;
      return total + itemTotal;
    }, 0);
    return total;
  }

}
