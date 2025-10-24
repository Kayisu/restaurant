import { Component, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Router } from '@angular/router';
import { Category, Subcategory, Product } from '../../../../../shared/interfaces/catalog.interface';
import { ImageUploadComponent, ImageUploadConfig } from '../../../../../shared/components/image-upload/image-upload.component';
import { UploadResponse } from '../../../../../core/services/upload.service';
import { CatalogManagementService } from '../../../../../core/services/catalog-management.service';

@Component({
  selector: 'app-catalog-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ImageUploadComponent],
  templateUrl: './catalog-management.component.html',
  styleUrls: ['./catalog-management.component.scss']
})
export class CatalogManagementComponent implements OnInit {
  // Tab management
  activeTab = signal<'categories' | 'subcategories' | 'products'>('categories');
  
  // Data signals
  categories = signal<Category[]>([]);
  subcategories = signal<Subcategory[]>([]);
  products = signal<Product[]>([]);
  
  
  
  // Loading states
  loading = signal(false);
  loadingCategories = signal(false);
  loadingSubcategories = signal(false);
  loadingProducts = signal(false);
  
  // Form states
  showAddCategoryForm = signal(false);
  showAddSubcategoryForm = signal(false);
  showAddProductForm = signal(false);
  
  // Edit states
  editingCategoryId = signal<number | null>(null);
  editingSubcategoryId = signal<number | null>(null);
  editingProductId = signal<string | null>(null);
  
  // Modal states
  showEditProductModal = signal(false);
  showEditCategoryModal = signal(false);
  showEditSubcategoryModal = signal(false);
  showHardDeleteModal = signal(false);
  showHardDeleteSubcategoryModal = signal(false);
  showDeleteProductModal = signal(false);
  selectedProduct = signal<Product | null>(null);
  selectedCategory = signal<Category | null>(null);
  selectedSubcategory = signal<Subcategory | null>(null);
  categoryToHardDelete = signal<number | null>(null);
  subcategoryToHardDelete = signal<number | null>(null);
  
  // Sorting and filtering states
  sortField = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  
  // Filter states
  categoryFilter = signal<number | null>(null);
  subcategoryFilter = signal<number | null>(null);
  statusFilter = signal<string | null>(null);
  searchTerm = signal<string>('');
  nameFilter = signal<string>('');
  priceFilter = signal<number | null>(null);
  maxPriceFilter = signal<number | null>(null);
  
  
  // Filtered data
  filteredCategories = signal<Category[]>([]);
  filteredSubcategories = signal<Subcategory[]>([]);
  filteredProducts = signal<Product[]>([]);
  
  
  
  // Form data
  newCategory = {
    name: '',
    description: '',
    image_url: '',
    is_active: true
  };
  
  newSubcategory = {
    name: '',
    description: '',
    image_url: '',
    is_active: true
  };
  
  newProduct = signal({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    is_available: true,
    preparation_time: null as number | null,
    category_id: null as number | null,
    subcategory_id: null as number | null
  });
  
  // Edit forms
  editCategoryForm = {
    name: '',
    description: '',
    image_url: '',
    is_active: true
  };

  editSubcategoryForm = {
    name: '',
    description: '',
    image_url: '',
    is_active: true
  };

  // Reactive form for product editing
  editProductForm: FormGroup;

  // Image upload configurations
  productImageUploadConfig: ImageUploadConfig = {
    type: 'product',
    variant: 'detail',
    multiple: false,
    showPreview: true,
    showProgress: true
  };

  categoryImageUploadConfig: ImageUploadConfig = {
    type: 'category',
    variant: 'card',
    multiple: false,
    showPreview: true,
    showProgress: true
  };

  subcategoryImageUploadConfig: ImageUploadConfig = {
    type: 'subcategory',
    variant: 'card',
    multiple: false,
    showPreview: true,
    showProgress: true
  };

  constructor(
    private catalogService: CatalogService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private catalogManagementService: CatalogManagementService,
    private fb: FormBuilder
  ) {
    // Initialize reactive form
    this.editProductForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      description: [''],
      price: [0, [Validators.required, Validators.min(0.01)]],
      image_url: [''],
      is_available: [true],
      preparation_time: [0]
    });

  }

  ngOnInit(): void {
    // Load categories and subcategories first, then products
    this.loadCategories();
    this.loadSubcategories();
    
    // Wait for categories and subcategories to load, then load products
    setTimeout(() => {
      this.loadProducts();
    }, 500);
    
    // Initialize filtered data
    this.applyFiltersAndSort();
  }

  // Tab management
  setActiveTab(tab: 'categories' | 'subcategories' | 'products'): void {
    this.activeTab.set(tab);
  }

  // Categories Management
  async loadCategories(): Promise<void> {
    this.loadingCategories.set(true);
    try {
      const categories = await this.catalogManagementService.loadCategories();
      this.categories.set(categories);
      this.applyFiltersAndSort();
    } catch (error) {
      // Error handling is done in the service
    } finally {
      this.loadingCategories.set(false);
    }
  }

  toggleAddCategoryForm(): void {
    this.showAddCategoryForm.set(!this.showAddCategoryForm());
    if (!this.showAddCategoryForm()) {
      this.resetCategoryForm();
    }
  }

  resetCategoryForm(): void {
    this.newCategory = {
      name: '',
      description: '',
      image_url: '',
      is_active: true
    };
  }

  async createCategory(): Promise<void> {
    if (!this.newCategory.name.trim()) {
      this.toastService.error('Error', 'Category name is required');
      return;
    }

    if (this.isCategoryNameDuplicate(this.newCategory.name)) {
      this.toastService.error('Error', 'A category with this name already exists');
      return;
    }

    this.loading.set(true);
    try {
      await this.catalogManagementService.createCategory(this.newCategory);
      await this.loadCategories();
      this.toggleAddCategoryForm();
    } catch (error) {
      // Error handling is done in the service
    } finally {
      this.loading.set(false);
    }
  }

  startEditCategory(category: Category): void {
    this.editingCategoryId.set(category.category_id);
    this.editCategoryForm = {
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      is_active: category.is_active
    };
  }

  cancelEditCategory(): void {
    this.editingCategoryId.set(null);
  }

  async updateCategory(categoryId: number): Promise<void> {
    if (!this.editCategoryForm.name.trim()) {
      this.toastService.error('Error', 'Category name is required');
      return;
    }

    if (this.isCategoryNameDuplicate(this.editCategoryForm.name, categoryId)) {
      this.toastService.error('Error', 'A category with this name already exists');
      return;
    }

    this.loading.set(true);
    try {
      await this.catalogManagementService.updateCategory(categoryId, this.editCategoryForm);
      await this.loadCategories();
      await this.loadSubcategories(); // Reload subcategories after category update
      this.cancelEditCategory();
      this.closeEditCategoryModal(); // Close modal if open
    } catch (error) {
      // Error handling is done in the service
    } finally {
      this.loading.set(false);
    }
  }


  hardDeleteCategory(categoryId: number): void {
    this.showHardDeleteModal.set(true);
    this.categoryToHardDelete.set(categoryId);
    this.selectedCategory.set(this.categories().find(c => c.category_id === categoryId) || null);
  }

  async confirmHardDeleteCategory(): Promise<void> {
    const categoryId = this.categoryToHardDelete();
    if (!categoryId) return;

    this.loading.set(true);
    try {
      await this.catalogManagementService.hardDeleteCategory(categoryId);
      await this.loadCategories();
      await this.loadSubcategories();
      await this.loadProducts();
    } catch (error: any) {
      // Check if it's a dependency error
      if (error.error && error.error.message) {
        if (error.error.message.includes('subcategories') || error.error.message.includes('products')) {
          this.toastService.error('Cannot Delete', 'This category has subcategories or products. Please delete them first.');
        } else if (error.error.message.includes('Cannot delete category used in bills')) {
          this.toastService.error('Cannot Delete Category', 'This category is being used in bills. Please remove it from bills first.');
        } else if (error.error.message.includes('Cannot delete category used in menus')) {
          this.toastService.error('Cannot Delete Category', 'This category is being used in menus. Please remove it from menus first.');
        } else {
          this.toastService.error('Error', error.error.message);
        }
      } else {
        this.toastService.error('Error', error?.message || 'Unknown error');
      }
    } finally {
      this.loading.set(false);
      this.showHardDeleteModal.set(false);
      this.categoryToHardDelete.set(null);
    }
  }

  cancelHardDeleteCategory(): void {
    this.showHardDeleteModal.set(false);
    this.categoryToHardDelete.set(null);
    this.selectedCategory.set(null);
  }

  // Subcategories Management
  loadSubcategories(): void {
    this.loadingSubcategories.set(true);
    this.catalogService.getAllSubcategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.subcategories.set(response.data);
          this.applyFiltersAndSort();
        } else {
          this.toastService.error('Error', 'Failed to load subcategories');
        }
        this.loadingSubcategories.set(false);
      },
      error: (error) => {
        this.toastService.error('Error', 'Error loading subcategories');
        this.loadingSubcategories.set(false);
      }
    });
  }

  toggleAddSubcategoryForm(): void {
    this.showAddSubcategoryForm.set(!this.showAddSubcategoryForm());
    if (!this.showAddSubcategoryForm()) {
      this.resetSubcategoryForm();
    }
  }

  resetSubcategoryForm(): void {
    this.newSubcategory = {
      name: '',
      description: '',
      image_url: '',
      is_active: true
    };
  }

  createSubcategory(): void {
    if (!this.newSubcategory.name.trim()) {
      this.toastService.error('Error', 'Subcategory name is required');
      return;
    }

    if (this.isSubcategoryNameDuplicate(this.newSubcategory.name)) {
      this.toastService.error('Error', 'A subcategory with this name already exists');
      return;
    }

    this.loading.set(true);
    this.catalogService.createSubcategory(this.newSubcategory).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Success', 'Subcategory created successfully');
          this.loadSubcategories();
          this.toggleAddSubcategoryForm();
        } else {
          this.toastService.error('Error', 'Failed to create subcategory');
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.toastService.error('Error', 'Error creating subcategory');
        this.loading.set(false);
      }
    });
  }

  startEditSubcategory(subcategory: Subcategory): void {
    this.editingSubcategoryId.set(subcategory.subcategory_id);
    this.editSubcategoryForm = {
      name: subcategory.name,
      description: subcategory.description || '',
      image_url: subcategory.image_url || '',
      is_active: subcategory.is_active
    };
  }

  cancelEditSubcategory(): void {
    this.editingSubcategoryId.set(null);
  }

  updateSubcategory(subcategoryId: number): void {
    if (!this.editSubcategoryForm.name.trim()) {
      this.toastService.error('Error', 'Subcategory name is required');
      return;
    }

    if (this.isSubcategoryNameDuplicate(this.editSubcategoryForm.name, subcategoryId)) {
      this.toastService.error('Error', 'A subcategory with this name already exists');
      return;
    }

    this.loading.set(true);
    this.catalogService.updateSubcategory(subcategoryId, this.editSubcategoryForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Success', 'Subcategory updated successfully');
          this.loadSubcategories();
          this.loadProducts(); // Reload products after subcategory update
          this.cancelEditSubcategory();
          this.closeEditSubcategoryModal(); // Close modal if open
        } else {
          this.toastService.error('Error', 'Failed to update subcategory');
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.toastService.error('Error', 'Error updating subcategory');
        this.loading.set(false);
      }
    });
  }


  hardDeleteSubcategory(subcategoryId: number): void {
    this.showHardDeleteSubcategoryModal.set(true);
    this.subcategoryToHardDelete.set(subcategoryId);
    this.selectedSubcategory.set(this.subcategories().find(s => s.subcategory_id === subcategoryId) || null);
  }

  confirmHardDeleteSubcategory(): void {
    const subcategoryId = this.subcategoryToHardDelete();
    if (!subcategoryId) return;

    this.loading.set(true);
    this.catalogService.hardDeleteSubcategory(subcategoryId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Success', 'Subcategory permanently deleted');
          this.loadSubcategories();
          this.loadProducts();
        } else {
          this.toastService.error('Error', 'Failed to permanently delete subcategory');
        }
        this.loading.set(false);
        this.showHardDeleteSubcategoryModal.set(false);
        this.subcategoryToHardDelete.set(null);
      },
      error: (error) => {
        
        
        // Check if it's a dependency error
        if (error.error && error.error.message) {
          if (error.error.message.includes('products')) {
            this.toastService.error('Cannot Delete', 'This subcategory has products. Please delete them first.');
          } else if (error.error.message.includes('Cannot delete subcategory used in bills')) {
            this.toastService.error('Cannot Delete Subcategory', 'This subcategory is being used in bills. Please remove it from bills first.');
          } else if (error.error.message.includes('Cannot delete subcategory used in menus')) {
            this.toastService.error('Cannot Delete Subcategory', 'This subcategory is being used in menus. Please remove it from menus first.');
          } else {
            this.toastService.error('Error', error.error.message);
          }
        } else {
          this.toastService.error('Error', 'Error permanently deleting subcategory');
        }
        
        this.loading.set(false);
        this.showHardDeleteSubcategoryModal.set(false);
        this.subcategoryToHardDelete.set(null);
      }
    });
  }

  cancelHardDeleteSubcategory(): void {
    this.showHardDeleteSubcategoryModal.set(false);
    this.subcategoryToHardDelete.set(null);
    this.selectedSubcategory.set(null);
  }

  // Products Management
  loadProducts(): void {
    this.loadingProducts.set(true);
    this.catalogService.getAllProducts().subscribe({
      next: (response) => {
        if (response.success) {
          // Merge products with category and subcategory names
          const productsWithNames = response.data.map((product: any) => {
            // Find category_id from subcategory_id
            const subcategory = this.subcategories().find(sub => sub.subcategory_id === product.subcategory_id);
            const categoryId = subcategory ? subcategory.category_id : null;
            
            const categoryName = categoryId ? this.getCategoryName(categoryId) : 'Unknown';
            const subcategoryName = this.getSubcategoryName(product.subcategory_id);
            
            return {
              ...product,
              category_id: categoryId, // Add category_id to product
              category_name: categoryName,
              subcategory_name: subcategoryName,
              preparation_time: product.preparation_time || 0 // Ensure preparation_time is preserved
            };
          });
          
          this.products.set(productsWithNames);
          this.applyFiltersAndSort();
        } else {
          this.toastService.error('Error', 'Failed to load products');
        }
        this.loadingProducts.set(false);
      },
      error: (error) => {
        this.toastService.error('Error', 'Error loading products');
        this.loadingProducts.set(false);
      }
    });
  }

  toggleAddProductForm(): void {
    this.showAddProductForm.set(!this.showAddProductForm());
    if (!this.showAddProductForm()) {
      this.resetProductForm();
    }
  }

  resetProductForm(): void {
    this.newProduct.set({
      name: '',
      description: '',
      price: 0,
      image_url: '',
      is_available: true,
      preparation_time: null,
      category_id: null,
      subcategory_id: null
    });
  }

  createProduct(): void {
    const product = this.newProduct();
    if (!product.name.trim()) {
      this.toastService.error('Error', 'Product name is required');
      return;
    }
    if (product.price <= 0) {
      this.toastService.error('Error', 'Price must be greater than 0');
      return;
    }
    if (!product.subcategory_id) {
      this.toastService.error('Error', 'Please select a subcategory');
      return;
    }

    if (this.isProductNameDuplicate(product.name)) {
      this.toastService.error('Error', 'A product with this name already exists');
      return;
    }

    this.loading.set(true);
    this.catalogService.createProduct({
      name: product.name.trim(),
      description: product.description.trim() || null,
      price: product.price,
      image_url: product.image_url.trim() || null,
      is_available: product.is_available,
      preparation_time: product.preparation_time ?? 0,
      subcategory_id: product.subcategory_id
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Success', 'Product created successfully');
          this.loadProducts();
          this.toggleAddProductForm();
        } else {
          this.toastService.error('Error', 'Failed to create product');
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.toastService.error('Error', 'Error creating product');
        this.loading.set(false);
      }
    });
  }

  startEditProduct(product: Product): void {
    this.editingProductId.set(product.product_id);
    this.editProductForm.patchValue({
      name: product.name,
      description: product.description || '',
      price: product.price,
      image_url: product.image_url || '',
      is_available: product.is_available,
      preparation_time: product.preparation_time || 0
    });
  }

  // Modal methods
  openEditProductModal(product: Product): void {
    this.selectedProduct.set(product);
    
    // Patch form with product data
    this.editProductForm.patchValue({
      name: product.name,
      description: product.description || '',
      price: product.price,
      image_url: product.image_url || '',
      is_available: product.is_available,
      preparation_time: product.preparation_time
    });
    
    this.showEditProductModal.set(true);
  }

  closeEditProductModal(): void {
    this.showEditProductModal.set(false);
    this.selectedProduct.set(null);
  }

  openEditCategoryModal(category: Category): void {
    this.selectedCategory.set(category);
    this.editCategoryForm = {
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      is_active: category.is_active
    };
    this.showEditCategoryModal.set(true);
  }

  closeEditCategoryModal(): void {
    this.showEditCategoryModal.set(false);
    this.selectedCategory.set(null);
  }

  openEditSubcategoryModal(subcategory: Subcategory): void {
    this.selectedSubcategory.set(subcategory);
    this.editSubcategoryForm = {
      name: subcategory.name,
      description: subcategory.description || '',
      image_url: subcategory.image_url || '',
      is_active: subcategory.is_active
    };
    this.showEditSubcategoryModal.set(true);
  }

  closeEditSubcategoryModal(): void {
    this.showEditSubcategoryModal.set(false);
    this.selectedSubcategory.set(null);
  }

  // Validation methods
  isCategoryNameDuplicate(name: string, excludeId?: number): boolean {
    return this.categories().some(cat => 
      cat.name.toLowerCase() === name.toLowerCase() && 
      cat.category_id !== excludeId
    );
  }

  isSubcategoryNameDuplicate(name: string, excludeId?: number): boolean {
    return this.subcategories().some(sub => 
      sub.name.toLowerCase() === name.toLowerCase() && 
      sub.subcategory_id !== excludeId
    );
  }

  isProductNameDuplicate(name: string, excludeId?: string): boolean {
    return this.products().some(prod => 
      prod.name.toLowerCase() === name.toLowerCase() && 
      prod.product_id !== excludeId
    );
  }

  // Image upload methods
  onImageUploaded(response: UploadResponse): void {
    this.toastService.success('Success', 'Image uploaded successfully!');
    
    // Update form with new image URL based on active modal
    if (this.showEditProductModal()) {
      this.editProductForm.patchValue({ image_url: response.data.imageUrl });
    } else if (this.showEditCategoryModal()) {
      this.editCategoryForm.image_url = response.data.imageUrl;
    } else if (this.showEditSubcategoryModal()) {
      this.editSubcategoryForm.image_url = response.data.imageUrl;
    } else if (this.showAddProductForm()) {
      this.newProduct.update(product => ({ ...product, image_url: response.data.imageUrl }));
    } else if (this.showAddCategoryForm()) {
      this.newCategory.image_url = response.data.imageUrl;
    } else if (this.showAddSubcategoryForm()) {
      this.newSubcategory.image_url = response.data.imageUrl;
    }
  }

  onImageRemoved(): void {
    this.toastService.success('Success', 'Image removed successfully!');
    
    // Clear image URL from form based on active modal
    if (this.showEditProductModal()) {
      this.editProductForm.patchValue({ image_url: '' });
    } else if (this.showEditCategoryModal()) {
      this.editCategoryForm.image_url = '';
    } else if (this.showEditSubcategoryModal()) {
      this.editSubcategoryForm.image_url = '';
    } else if (this.showAddProductForm()) {
      this.newProduct.update(product => ({ ...product, image_url: '' }));
    } else if (this.showAddCategoryForm()) {
      this.newCategory.image_url = '';
    } else if (this.showAddSubcategoryForm()) {
      this.newSubcategory.image_url = '';
    }
  }

  cancelEditProduct(): void {
    this.editingProductId.set(null);
  }

  updateProduct(productId: string): void {

    if (!productId || productId.trim() === '') {
      this.toastService.error('Error', 'Product ID is required');
      return;
    }

    if (!this.editProductForm.valid) {
      this.toastService.error('Error', 'Please fill in all required fields');
      return;
    }

    const formValue = this.editProductForm.value;
    
    if (this.isProductNameDuplicate(formValue.name, productId)) {
      this.toastService.error('Error', 'A product with this name already exists');
      return;
    }

    const updateData = {
      name: formValue.name.trim(),
      description: formValue.description.trim() || null,
      price: formValue.price,
      image_url: formValue.image_url.trim() || null,
      is_available: formValue.is_available,
      preparation_time: formValue.preparation_time || 0
    };


    this.loading.set(true);
    this.catalogService.updateProduct(productId, updateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Success', 'Product updated successfully');
          
          // Update local data immediately
          const updatedProduct = response.data;
          
          // Find category_id from subcategory_id
          const subcategory = this.subcategories().find(sub => sub.subcategory_id === updatedProduct.subcategory_id);
          const categoryId = subcategory ? subcategory.category_id : null;
          
          // Merge with existing product data to preserve category_name and subcategory_name
          const existingProduct = this.products().find(p => p.product_id === productId);
          const mergedProduct = {
            ...updatedProduct,
            category_id: categoryId, // Add category_id to product
            category_name: existingProduct?.category_name || (categoryId ? this.getCategoryName(categoryId) : 'Unknown'),
            subcategory_name: existingProduct?.subcategory_name || this.getSubcategoryName(updatedProduct.subcategory_id)
          };
          
          this.products.update(products => 
            products.map(p => p.product_id === productId ? mergedProduct : p)
          );
          
          this.filteredProducts.update(products => 
            products.map(p => p.product_id === productId ? mergedProduct : p)
          );
          
          this.cancelEditProduct();
          this.closeEditProductModal();
        } else {
          this.toastService.error('Error', 'Failed to update product');
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.toastService.error('Error', 'Error updating product');
        this.loading.set(false);
      }
    });
  }

  deleteProduct(productId: string): void {
    this.showDeleteProductModal.set(true);
    this.selectedProduct.set(this.products().find(p => p.product_id === productId) || null);
  }

  confirmDeleteProduct(): void {
    const product = this.selectedProduct();
    if (!product) return;

    this.loading.set(true);
    this.catalogService.deleteProduct(product.product_id).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Success', 'Product permanently deleted');
          this.loadProducts();
        } else {
          this.toastService.error('Error', 'Failed to delete product');
        }
        this.loading.set(false);
        this.showDeleteProductModal.set(false);
        this.selectedProduct.set(null);
      },
      error: (error) => {
        
        // Check if it's a specific backend error about bill or menu usage
        if (error.error && error.error.message) {
          if (error.error.message.includes('Cannot delete product used in bills')) {
            this.toastService.error('Cannot Delete Product', 'This product is being used in bills. Please remove it from bills first.');
          } else if (error.error.message.includes('Cannot delete product used in menus')) {
            this.toastService.error('Cannot Delete Product', 'This product is being used in menus. Please remove it from menus first.');
          } else {
            this.toastService.error('Error', 'Error deleting product');
          }
        } else {
          this.toastService.error('Error', 'Error deleting product');
        }
        
        this.loading.set(false);
        this.showDeleteProductModal.set(false);
        this.selectedProduct.set(null);
      }
    });
  }

  cancelDeleteProduct(): void {
    this.showDeleteProductModal.set(false);
    this.selectedProduct.set(null);
  }

  // Helper methods
  getCategoryName(categoryId: number): string {
    const category = this.categories().find(c => c.category_id === categoryId);
    return category ? category.name : 'Unknown';
  }

  getSubcategoryName(subcategoryId: number): string {
    const subcategory = this.subcategories().find(s => s.subcategory_id === subcategoryId);
    return subcategory ? subcategory.name : 'Unknown';
  }



  // Update methods for newProduct signal
  updateNewProductName(name: string): void {
    this.newProduct.update(product => ({ ...product, name }));
  }


  updateNewProductPrice(price: number): void {
    this.newProduct.update(product => ({ ...product, price }));
  }




  // Toggle status functions
  toggleProductStatus(product: Product): void {
    this.loading.set(true);
    this.catalogService.updateProduct(product.product_id, {
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      is_available: !product.is_available,
      preparation_time: product.preparation_time
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Success', `Product ${!product.is_available ? 'enabled' : 'disabled'} successfully`);
          this.loadProducts();
        } else {
          this.toastService.error('Error', 'Failed to update product status');
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.toastService.error('Error', 'Error updating product status');
        this.loading.set(false);
      }
    });
  }

  async toggleCategoryStatus(category: Category): Promise<void> {
    this.loading.set(true);
    try {
      await this.catalogManagementService.updateCategoryStatus(category.category_id, !category.is_active);
      this.toastService.success('Success', `Category ${!category.is_active ? 'enabled' : 'disabled'} successfully`);
      await this.loadCategories();
    } catch (error) {
      // Error handling is done in the service
    } finally {
      this.loading.set(false);
    }
  }

  toggleSubcategoryStatus(subcategory: Subcategory): void {
    this.loading.set(true);
    this.catalogService.updateSubcategory(subcategory.subcategory_id, {
      name: subcategory.name,
      description: subcategory.description,
      image_url: subcategory.image_url,
      is_active: !subcategory.is_active
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Success', `Subcategory ${!subcategory.is_active ? 'enabled' : 'disabled'} successfully`);
          this.loadSubcategories();
        } else {
          this.toastService.error('Error', 'Failed to update subcategory status');
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.toastService.error('Error', 'Error updating subcategory status');
        this.loading.set(false);
      }
    });
  }

  // Sorting methods
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

  // Filtering methods
  onSearchChange(): void {
    this.applyFiltersAndSort();
  }

  onCategoryFilterChange(): void {
    // Clear subcategory filter when category changes
    this.subcategoryFilter.set(null);
    this.applyFiltersAndSort();
  }

  onCategoryChangeForProduct(categoryId: number): void {
    this.newProduct.update(product => ({ 
      ...product, 
      category_id: categoryId,
      subcategory_id: null // Clear subcategory when category changes
    }));
  }

  updateNewProductCategory(categoryId: number): void {
    this.newProduct.update(product => ({ ...product, category_id: categoryId }));
  }

  updateNewProductSubcategory(subcategoryId: number): void {
    this.newProduct.update(product => ({ ...product, subcategory_id: subcategoryId }));
  }

  // Get subcategories filtered by selected category for product form
  getFilteredSubcategoriesForProduct() {
    const selectedCategoryId = this.newProduct().category_id;
    if (!selectedCategoryId) return [];
    
    return this.subcategories().filter(sub => sub.category_id === selectedCategoryId);
  }

  onSubcategoryFilterChange(): void {
    this.applyFiltersAndSort();
  }

  onStatusFilterChange(): void {
    this.applyFiltersAndSort();
  }

  onNameFilterChange(): void {
    this.applyFiltersAndSort();
  }

  onPriceFilterChange(): void {
    // Ensure price filter is not negative
    if (this.priceFilter() !== null && this.priceFilter()! < 0) {
      this.priceFilter.set(0);
    }
    this.applyFiltersAndSort();
  }

  onMaxPriceFilterChange(): void {
    // Ensure max price filter is not negative
    if (this.maxPriceFilter() !== null && this.maxPriceFilter()! < 0) {
      this.maxPriceFilter.set(0);
    }
    this.applyFiltersAndSort();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.categoryFilter.set(null);
    this.subcategoryFilter.set(null);
    this.statusFilter.set(null);
    this.nameFilter.set('');
    this.priceFilter.set(null);
    this.maxPriceFilter.set(null);
    this.sortField.set('');
    this.sortDirection.set('asc');
    this.applyFiltersAndSort();
  }
  

  // Apply filters and sorting
  applyFiltersAndSort(): void {
    this.filterCategories();
    this.filterSubcategories();
    this.filterProducts();
  }

  private filterCategories(): void {
    let filtered = [...this.categories()];

    // Name filter
    if (this.nameFilter()) {
      const term = this.nameFilter().toLowerCase();
      filtered = filtered.filter(category => 
        category.name.toLowerCase().includes(term)
      );
    }

    // Search filter (description)
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(category => 
        (category.description && category.description.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (this.statusFilter()) {
      filtered = filtered.filter(category => 
        this.statusFilter() === 'active' ? category.is_active : !category.is_active
      );
    }

    // Sort
    if (this.sortField()) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (this.sortField()) {
          case 'name':
            return this.sortDirection() === 'asc' 
              ? a.name.localeCompare(b.name, 'tr-TR')
              : b.name.localeCompare(a.name, 'tr-TR');
          case 'description':
            const aDesc = a.description || '';
            const bDesc = b.description || '';
            return this.sortDirection() === 'asc' 
              ? aDesc.localeCompare(bDesc, 'tr-TR')
              : bDesc.localeCompare(aDesc, 'tr-TR');
          case 'status':
            aValue = a.is_active ? 'active' : 'inactive';
            bValue = b.is_active ? 'active' : 'inactive';
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return this.sortDirection() === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection() === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredCategories.set(filtered);
  }

  private filterSubcategories(): void {
    let filtered = [...this.subcategories()];
    

    // Name filter
    if (this.nameFilter()) {
      const term = this.nameFilter().toLowerCase();
      filtered = filtered.filter(subcategory => 
        subcategory.name.toLowerCase().includes(term)
      );
    }

    // Search filter (description)
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(subcategory => 
        (subcategory.description && subcategory.description.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (this.categoryFilter()) {
      const beforeCount = filtered.length;
      const categoryFilterValue = Number(this.categoryFilter());
      filtered = filtered.filter(subcategory => {
        const matches = (subcategory as any).category_id === categoryFilterValue;
        if (!matches) {
        }
        return matches;
      });
    }

    // Status filter
    if (this.statusFilter()) {
      filtered = filtered.filter(subcategory => 
        this.statusFilter() === 'active' ? subcategory.is_active : !subcategory.is_active
      );
    }

    // Sort
    if (this.sortField()) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (this.sortField()) {
          case 'name':
            return this.sortDirection() === 'asc' 
              ? a.name.localeCompare(b.name, 'tr-TR')
              : b.name.localeCompare(a.name, 'tr-TR');
          case 'category':
            const aCategoryName = this.getCategoryName((a as any).category_id);
            const bCategoryName = this.getCategoryName((b as any).category_id);
            return this.sortDirection() === 'asc' 
              ? aCategoryName.localeCompare(bCategoryName, 'tr-TR')
              : bCategoryName.localeCompare(aCategoryName, 'tr-TR');
          case 'description':
            const aDesc = a.description || '';
            const bDesc = b.description || '';
            return this.sortDirection() === 'asc' 
              ? aDesc.localeCompare(bDesc, 'tr-TR')
              : bDesc.localeCompare(aDesc, 'tr-TR');
          case 'status':
            aValue = a.is_active ? 'active' : 'inactive';
            bValue = b.is_active ? 'active' : 'inactive';
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return this.sortDirection() === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection() === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredSubcategories.set(filtered);
  }

  private filterProducts(): void {
    let filtered = [...this.products()];
    

    // Name filter
    if (this.nameFilter()) {
      const term = this.nameFilter().toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term)
      );
    }

    // Price filter (min)
    if (this.priceFilter()) {
      filtered = filtered.filter(product => 
        product.price >= this.priceFilter()!
      );
    }

    // Price filter (max)
    if (this.maxPriceFilter()) {
      filtered = filtered.filter(product => 
        product.price <= this.maxPriceFilter()!
      );
    }

    // Search filter (general)
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term)) ||
        product.category_name.toLowerCase().includes(term) ||
        product.subcategory_name.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (this.categoryFilter()) {
      const beforeCount = filtered.length;
      const categoryFilterValue = Number(this.categoryFilter());
      filtered = filtered.filter(product => {
        const matches = product.category_id === categoryFilterValue;
        if (!matches) {
        }
        return matches;
      });
    }

    // Subcategory filter
    if (this.subcategoryFilter()) {
      const beforeCount = filtered.length;
      const subcategoryFilterValue = Number(this.subcategoryFilter());
      filtered = filtered.filter(product => {
        const matches = product.subcategory_id === subcategoryFilterValue;
        if (!matches) {
        }
        return matches;
      });
    }

    // Status filter
    if (this.statusFilter()) {
      filtered = filtered.filter(product => 
        this.statusFilter() === 'available' ? product.is_available : !product.is_available
      );
    }

    // Sort
    if (this.sortField()) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (this.sortField()) {
          case 'name':
            return this.sortDirection() === 'asc' 
              ? a.name.localeCompare(b.name, 'tr-TR')
              : b.name.localeCompare(a.name, 'tr-TR');
          case 'category':
            return this.sortDirection() === 'asc' 
              ? a.category_name.localeCompare(b.category_name, 'tr-TR')
              : b.category_name.localeCompare(a.category_name, 'tr-TR');
          case 'subcategory':
            return this.sortDirection() === 'asc' 
              ? a.subcategory_name.localeCompare(b.subcategory_name, 'tr-TR')
              : b.subcategory_name.localeCompare(a.subcategory_name, 'tr-TR');
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'status':
            aValue = a.is_available ? 'available' : 'unavailable';
            bValue = b.is_available ? 'available' : 'unavailable';
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return this.sortDirection() === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection() === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredProducts.set(filtered);
  }
}