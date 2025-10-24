import { Component, signal, computed, OnInit, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { RestaurantApiService } from '../../../../../core/services/restaurant-api.service';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Bill, BillProduct, Product, Category, Subcategory, Menu, AddBillMenuRequest } from '../../../../../shared/interfaces';

@Component({
  selector: 'app-bill-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bill-edit.component.html',
  styleUrls: ['./bill-edit.component.scss']
})
export class BillEditComponent implements OnInit {
  // Input/Output properties for modal
  @Input() bill: Bill | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // Signals
  billProducts = signal<BillProduct[]>([]);
  availableProducts = signal<Product[]>([]);
  availableCategories = signal<Category[]>([]);
  availableMenus = signal<Menu[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  showAddProductForm = signal(false);
  showAddMenuForm = signal(false);
  showDeleteConfirmModal = signal(false);
  productToDelete = signal<BillProduct | null>(null);

  // Form data - using signals for reactive updates
  billForm = {
    bill_number: '',
    customer_name: '',
    customer_phone: '',
    table_id: '',
    payment_status: 'pending' as 'pending' | 'paid' | 'cancelled' | 'refunded',
    bill_date: '',
    tax_amount: 0,
    discount_amount: signal(0),
    service_charge: signal(0)
  };

  newProduct = {
    product_id: '',
    quantity: 1,
    unit_price: 0
  };

  newMenu = {
    menu_id: '',
    quantity: 1,
    unit_price: 0
  };

  // Product selection filters
  selectedCategoryId = signal('');
  selectedSubcategoryId = signal('');
  productSearchTerm = signal('');
  availableSubcategories = signal<Subcategory[]>([]);
  filteredProducts = signal<Product[]>([]);

  // Tax calculation
  taxPercentage = signal(10); // Default 10% for food items
  
  // Service charge calculation
  serviceChargePercentage = signal(5); // Default 5% service charge

  // Computed
  calculatedSubtotal = computed(() => {
    const products = this.billProducts();
    const subtotal = products.reduce((sum, product) => sum + parseFloat(String(product.total_price)), 0);
    return subtotal;
  });

  calculatedTaxAmount = computed(() => {
    const subtotal = this.calculatedSubtotal();
    const percentage = this.taxPercentage();
    if (isNaN(subtotal) || isNaN(percentage)) {
      return 0;
    }
    const result = (subtotal * percentage) / 100;
    return Math.round(result * 100) / 100; // Round to 2 decimal places
  });

  calculatedServiceCharge = computed(() => {
    const subtotal = this.calculatedSubtotal();
    const percentage = this.serviceChargePercentage();
    if (isNaN(subtotal) || isNaN(percentage)) {
      return 0;
    }
    const result = (subtotal * percentage) / 100;
    return Math.round(result * 100) / 100; // Round to 2 decimal places
  });

  calculatedTotal = computed(() => {
    const subtotal = this.calculatedSubtotal();
    const tax = this.calculatedTaxAmount();
    const discount = parseFloat(String(this.billForm.discount_amount())) || 0;
    const service = this.calculatedServiceCharge(); // Use calculated service charge instead of manual input

    if (isNaN(subtotal) || isNaN(tax) || isNaN(discount) || isNaN(service)) {
      return 0;
    }

    const totalBeforeDiscount = subtotal + tax + service;
    
    // Discount cannot exceed total before discount (prevent negative total)
    const maxDiscount = totalBeforeDiscount;
    const actualDiscount = Math.min(discount, maxDiscount);
    
    const result = totalBeforeDiscount - actualDiscount;
    return Math.round(result * 100) / 100; // Round to 2 decimal places
  });

  calculateTaxAmount() {
    // This method is called when tax percentage changes
    // The computed signal will automatically update
  }

  calculateServiceCharge() {
    // This method is called when service charge percentage changes
    // The computed signal will automatically update
  }

  constructor(
    private restaurantApi: RestaurantApiService,
    private catalogService: CatalogService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    if (this.bill) {
      this.loadBill();
    }
    this.loadAvailableProducts();
    this.loadAvailableCategories();
    this.loadAvailableMenus();
  }

  async loadBill() {
    if (!this.bill) {
      this.error.set('No bill provided');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      // Load bill details
      const billResponse = await firstValueFrom(this.restaurantApi.getBillById(this.bill.bill_id));

      if (billResponse?.success && billResponse?.data) {
        // Update the bill object with fresh data
        this.bill = billResponse.data;
        
        // Populate form
        this.billForm = {
          bill_number: billResponse.data.bill_number,
          customer_name: billResponse.data.customer_name || '',
          customer_phone: billResponse.data.customer_phone || '',
          table_id: billResponse.data.table_id || '',
          payment_status: billResponse.data.payment_status,
          bill_date: this.formatDateForInput(billResponse.data.bill_date),
          tax_amount: billResponse.data.tax_amount || 0,
          discount_amount: signal(billResponse.data.discount_amount || 0),
          service_charge: signal(billResponse.data.service_charge || 0)
        };

        // Load tax and service charge percentages from backend
        if (billResponse.data.tax_amount && billResponse.data.subtotal) {
          const taxPercentage = (billResponse.data.tax_amount / billResponse.data.subtotal) * 100;
          this.taxPercentage.set(Math.round(taxPercentage * 100) / 100);
        }
        
        if (billResponse.data.service_charge && billResponse.data.subtotal) {
          const servicePercentage = (billResponse.data.service_charge / billResponse.data.subtotal) * 100;
          this.serviceChargePercentage.set(Math.round(servicePercentage * 100) / 100);
        }

        // Products are now included directly in the bill response
        if (billResponse.data.products && Array.isArray(billResponse.data.products)) {
          this.billProducts.set(billResponse.data.products);
        } else {
          this.billProducts.set([]);
        }
      } else {
        this.error.set(billResponse?.message || 'Failed to load bill');
      }
    } catch (error) {
      this.error.set('An error occurred while loading the bill');
    } finally {
      this.loading.set(false);
    }
  }

  async loadAvailableProducts() {
    try {
      const response = await firstValueFrom(this.catalogService.getAllProducts());
      if (response?.success && response?.data) {
        this.availableProducts.set(response.data);
        this.filteredProducts.set(response.data);
      }
    } catch (error) {
    }
  }

  async loadAvailableCategories() {
    try {
      const response = await firstValueFrom(this.catalogService.getAllCategories());
      if (response?.success && response?.data) {
        this.availableCategories.set(response.data);
      }
    } catch (error) {
    }
  }

  async loadAvailableMenus() {
    try {
      const response = await firstValueFrom(this.restaurantApi.getAllMenus());
      if (response?.success && response?.data) {
        this.availableMenus.set(response.data);
      }
    } catch (error) {
    }
  }

  formatPrice(price: number | string): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toggleAddProductForm() {
    this.showAddProductForm.set(!this.showAddProductForm());
    if (this.showAddProductForm()) {
      this.resetNewProduct();
    }
  }

  toggleAddMenuForm() {
    this.showAddMenuForm.set(!this.showAddMenuForm());
    if (this.showAddMenuForm()) {
      this.resetNewMenu();
    }
  }

  resetNewProduct() {
    this.newProduct = {
      product_id: '',
      quantity: 1,
      unit_price: 0
    };
    this.selectedCategoryId.set('');
    this.selectedSubcategoryId.set('');
    this.productSearchTerm.set('');
    this.availableSubcategories.set([]);
    this.filteredProducts.set(this.availableProducts());
  }

  resetNewMenu() {
    this.newMenu = {
      menu_id: '',
      quantity: 1,
      unit_price: 0
    };
  }

  onCategoryChange() {
    const categoryId = this.selectedCategoryId();
    if (categoryId) {
      // Load subcategories for selected category
      this.loadSubcategoriesForCategory(parseInt(categoryId));
    } else {
      this.availableSubcategories.set([]);
      this.selectedSubcategoryId.set('');
    }
    this.filterProducts();
  }

  onSubcategoryChange() {
    this.filterProducts();
  }

  onSearchChange() {
    this.filterProducts();
  }

  async loadSubcategoriesForCategory(categoryId: number) {
    try {
      const response = await firstValueFrom(this.catalogService.getAllSubcategories());
      if (response?.success && response?.data) {
        // Filter subcategories by category - we need to get this from products
        // For now, let's get all subcategories and filter by products
        const allProducts = this.availableProducts();
        const categoryProductIds = allProducts
          .filter(p => p.category_id === categoryId)
          .map(p => p.subcategory_id);
        const uniqueSubcategoryIds = [...new Set(categoryProductIds)];
        const filteredSubcategories = response.data.filter(sub =>
          uniqueSubcategoryIds.includes(sub.subcategory_id)
        );
        this.availableSubcategories.set(filteredSubcategories);
      }
    } catch (error) {
    }
  }

  filterProducts() {
    let filtered = this.availableProducts();
    const searchTerm = this.productSearchTerm().toLowerCase();
    const categoryId = this.selectedCategoryId();
    const subcategoryId = this.selectedSubcategoryId();

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by category
    if (categoryId) {
      filtered = filtered.filter(product => product.category_id === parseInt(categoryId));
    }

    // Filter by subcategory
    if (subcategoryId) {
      filtered = filtered.filter(product => product.subcategory_id === parseInt(subcategoryId));
    }

    this.filteredProducts.set(filtered);
  }

  onProductSelect() {
    const product = this.filteredProducts().find(p => p.product_id.toString() === this.newProduct.product_id);
    if (product) {
      this.newProduct.unit_price = product.price;
    }
  }

  onMenuSelect() {
    const menu = this.availableMenus().find(m => m.menu_id.toString() === this.newMenu.menu_id);
    if (menu) {
      this.newMenu.unit_price = parseFloat(menu.price.toString()); // Convert to number
    }
  }

  async addProduct() {
    if (!this.newProduct.product_id || !this.newProduct.quantity || !this.newProduct.unit_price) {
      this.toastService.error('Error', 'Please fill all product fields');
      return;
    }

    if (this.newProduct.unit_price <= 0) {
      this.toastService.error('Error', 'Unit price must be greater than 0');
      return;
    }

    if (this.newProduct.quantity <= 0) {
      this.toastService.error('Error', 'Quantity must be greater than 0');
      return;
    }

    const product = this.filteredProducts().find(p => p.product_id.toString() === this.newProduct.product_id);
    if (!product) {
      this.toastService.error('Error', 'Product not found');
      return;
    }

    if (!this.bill) {
      this.toastService.error('Error', 'No bill selected');
      return;
    }

    // Check if product already exists in bill
    const existingProduct = this.billProducts().find(bp => 
      bp && bp.product_id && bp.product_id.toString() === this.newProduct.product_id
    );

    if (existingProduct) {
      // Update existing product quantity
      const newQuantity = existingProduct.quantity + this.newProduct.quantity;
      const newTotalPrice = newQuantity * this.newProduct.unit_price;


      try {
        const response = await firstValueFrom(this.restaurantApi.updateBillProduct(
          existingProduct.bill_product_id,
          {
            quantity: newQuantity,
            unit_price: this.newProduct.unit_price,
            total_price: newTotalPrice,
            discount_amount: existingProduct.discount_amount
          }
        ));

        if (response?.success) {
          this.toastService.success('Success', `Product quantity updated to ${newQuantity}`);
          this.loadBill(); // Reload to get updated data
          this.toggleAddProductForm();
        } else {
          this.toastService.error('Error', response?.message || 'Failed to update product quantity');
        }
      } catch (error) {
        this.toastService.error('Error', 'An error occurred while updating product quantity');
      }
    } else {

      // Add new product
      try {
        const response = await firstValueFrom(this.restaurantApi.addBillProduct(this.bill.bill_id, {
          product_id: this.newProduct.product_id,
          quantity: this.newProduct.quantity,
          unit_price: this.newProduct.unit_price,
          total_price: this.newProduct.quantity * this.newProduct.unit_price,
          discount_amount: 0
        }));

        if (response?.success) {
          this.toastService.success('Success', 'Product added to bill');
          this.loadBill(); // Reload to get updated data
          this.toggleAddProductForm();
        } else {
          this.toastService.error('Error', response?.message || 'Failed to add product to bill');
        }
      } catch (error) {
        this.toastService.error('Error', 'An error occurred while adding product');
      }
    }
  }

  async addMenu() {
    if (!this.newMenu.menu_id || !this.newMenu.quantity || !this.newMenu.unit_price) {
      this.toastService.error('Error', 'Please fill all menu fields');
      return;
    }

    if (this.newMenu.unit_price <= 0) {
      this.toastService.error('Error', 'Unit price must be greater than 0');
      return;
    }

    if (this.newMenu.quantity <= 0) {
      this.toastService.error('Error', 'Quantity must be greater than 0');
      return;
    }

    const menu = this.availableMenus().find(m => m.menu_id.toString() === this.newMenu.menu_id);
    if (!menu) {
      this.toastService.error('Error', 'Menu not found');
      return;
    }

    if (!this.bill) {
      this.toastService.error('Error', 'No bill selected');
      return;
    }

    // Check if menu already exists in bill
    const existingMenu = this.billProducts().find(bp => 
      bp && bp.product_id && bp.product_id.toString() === this.newMenu.menu_id && 
      bp.product_name && bp.product_name.toLowerCase().includes('menü')
    );

    if (existingMenu) {
      // Update existing menu quantity
      const newQuantity = existingMenu.quantity + this.newMenu.quantity;
      const newTotalPrice = newQuantity * this.newMenu.unit_price;

      try {
        const response = await firstValueFrom(this.restaurantApi.updateBillProduct(
          existingMenu.bill_product_id,
          {
            quantity: newQuantity,
            unit_price: this.newMenu.unit_price,
            total_price: newTotalPrice,
            discount_amount: existingMenu.discount_amount
          }
        ));

        if (response?.success) {
          this.toastService.success('Success', `Menu quantity updated to ${newQuantity}`);
          this.loadBill(); // Reload to get updated data
          this.toggleAddMenuForm();
        } else {
          this.toastService.error('Error', response?.message || 'Failed to update menu quantity');
        }
      } catch (error) {
        this.toastService.error('Error', 'An error occurred while updating menu quantity');
      }
      return;
    }

    // Add new menu to bill
    try {
      const menuData = {
        menu_id: this.newMenu.menu_id, // Keep as string like product_id
        quantity: this.newMenu.quantity,
        unit_price: parseFloat(this.newMenu.unit_price.toString()), // Convert to number
        total_price: this.newMenu.quantity * parseFloat(this.newMenu.unit_price.toString()), // Convert to number for calculation
        discount_amount: 0
      };



      const response = await firstValueFrom(this.restaurantApi.addBillMenu(this.bill.bill_id, menuData));

      if (response?.success) {
        this.toastService.success('Success', 'Menu added to bill');
        this.loadBill(); // Reload to get updated data
        this.toggleAddMenuForm();
      } else {
        this.toastService.error('Error', response?.message || 'Failed to add menu to bill');
      }
    } catch (error: any) {
      
      let errorMessage = 'An error occurred while adding menu';
      
      if (error?.status === 400) {
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.error?.errors && Array.isArray(error.error.errors)) {
          const validationErrors = error.error.errors.map((err: any) => err.message || err).join(', ');
          errorMessage = `Validation errors: ${validationErrors}`;
        } else {
          errorMessage = 'Invalid menu data. Please check all fields and try again.';
        }
      } else if (error?.status === 404) {
        errorMessage = 'Menu or bill not found. Please refresh and try again.';
      } else if (error?.status === 409) {
        errorMessage = 'This menu is already added to the bill.';
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      }
      
      this.toastService.error('Add Menu Failed', errorMessage);
    }
  }

  increaseQuantity(product: BillProduct) {
    product.quantity++;
    product.total_price = product.quantity * product.unit_price;
    this.updateProduct(product);
  }

  decreaseQuantity(product: BillProduct) {
    if (product.quantity > 1) {
      product.quantity--;
      product.total_price = product.quantity * product.unit_price;
      this.updateProduct(product);
    }
  }

  async updateProduct(product: BillProduct) {
    if (product.unit_price <= 0) {
      this.toastService.error('Error', 'Unit price must be greater than 0');
      return;
    }

    if (product.quantity <= 0) {
      this.toastService.error('Error', 'Quantity must be greater than 0');
      return;
    }

    try {
      const response = await firstValueFrom(this.restaurantApi.updateBillProduct(product.bill_product_id, {
        quantity: product.quantity,
        unit_price: product.unit_price,
        total_price: product.total_price,
        discount_amount: product.discount_amount
      }));

      if (response?.success) {
        this.toastService.success('Success', 'Product updated');
        this.loadBill();
      } else {
        this.toastService.error('Error', response?.message || 'Failed to update product');
      }
    } catch (error) {
      this.toastService.error('Error', 'An error occurred while updating product');
    }
  }

  removeProduct(product: BillProduct) {
    this.productToDelete.set(product);
    this.showDeleteConfirmModal.set(true);
  }

  async confirmRemoveProduct() {
    const product = this.productToDelete();
    if (!product) return;

    try {
      const response = await firstValueFrom(this.restaurantApi.removeBillProduct(product.bill_product_id));

      if (response?.success) {
        this.toastService.success('Success', 'Product removed from bill');
        this.loadBill();
        this.closeDeleteConfirmModal();
      } else {
        this.toastService.error('Error', response?.message || 'Failed to remove product');
      }
    } catch (error) {
      this.toastService.error('Error', 'An error occurred while removing product');
    }
  }

  closeDeleteConfirmModal() {
    this.showDeleteConfirmModal.set(false);
    this.productToDelete.set(null);
  }

  async saveBill() {
    if (!this.bill) {
      this.toastService.error('Error', 'No bill selected');
      return;
    }

    this.saving.set(true);

    try {
      const totalAmount = this.calculatedTotal();

      const updateData = {
        payment_status: this.billForm.payment_status,
        subtotal: this.calculatedSubtotal(),
        tax_amount: this.calculatedTaxAmount(),
        discount_amount: this.billForm.discount_amount(),
        service_charge: this.calculatedServiceCharge(), // Use calculated service charge
        total_amount: totalAmount || 0  // Ensure it's never null/undefined
      };

      const response = await firstValueFrom(this.restaurantApi.updateBill(this.bill.bill_id, updateData));

      if (response?.success) {
        this.toastService.success('Success', 'Bill updated successfully');
        // Reload bill data to show updated information
        await this.loadBill();
        this.saved.emit();
      } else {
        this.toastService.error('Error', response?.message || 'Failed to update bill');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to save bill');
    } finally {
      this.saving.set(false);
    }
  }


  goBack() {
    this.close.emit();
  }

  cancelAddProduct() {
    this.toggleAddProductForm();
  }

  cancelAddMenu() {
    this.toggleAddMenuForm();
  }

  // Bill Status Management Methods
  async markAsCompleted() {
    if (!this.bill) return;

    if (!confirm(`Are you sure you want to mark bill #${this.bill.bill_number} as completed?`)) {
      return;
    }

    try {
      const response = await firstValueFrom(this.restaurantApi.completeBill(this.bill.bill_id));

      if (response?.success) {
        this.toastService.success('Success', 'Bill marked as completed successfully');
        this.loadBill(); // Reload to get updated data
      } else {
        this.toastService.error('Error', 'Failed to mark bill as completed');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to mark bill as completed');
    }
  }

  async cancelBill() {
    if (!this.bill) return;

    if (!confirm(`Are you sure you want to cancel bill #${this.bill.bill_number}?`)) {
      return;
    }

    try {
      const response = await firstValueFrom(this.restaurantApi.cancelBill(this.bill.bill_id));

      if (response?.success) {
        this.toastService.success('Success', 'Bill cancelled successfully');
        this.loadBill(); // Reload to get updated data
      } else {
        this.toastService.error('Error', 'Failed to cancel bill');
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to cancel bill');
    }
  }
}