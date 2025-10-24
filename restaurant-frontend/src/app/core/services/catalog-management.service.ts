import { Injectable } from '@angular/core';
import { CatalogService } from './catalog.service';
import { ToastService } from './toast.service';
import { Category, Subcategory, Product } from '../../shared/interfaces/catalog.interface';

@Injectable({
  providedIn: 'root'
})
export class CatalogManagementService {
  
  constructor(
    private catalogService: CatalogService,
    private toastService: ToastService
  ) {}

  // Category Operations
  async loadCategories(): Promise<Category[]> {
    return new Promise((resolve, reject) => {
      this.catalogService.getAllCategories().subscribe({
        next: (response: any) => {
          if (response.success) {
            resolve(response.data);
          } else {
            this.toastService.error('Error', 'Failed to load categories');
            reject(new Error('Failed to load categories'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error loading categories');
          reject(error);
        }
      });
    });
  }

  async createCategory(categoryData: any): Promise<Category> {
    return new Promise((resolve, reject) => {
      this.catalogService.createCategory(categoryData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Success', 'Category created successfully');
            resolve(response.data);
          } else {
            this.toastService.error('Error', 'Error creating category');
            reject(new Error('Failed to create category'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error creating category');
          reject(error);
        }
      });
    });
  }

  async updateCategory(categoryId: number, categoryData: any): Promise<Category> {
    return new Promise((resolve, reject) => {
      this.catalogService.updateCategory(categoryId, categoryData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Success', 'Category updated successfully');
            resolve(response.data);
          } else {
            this.toastService.error('Error', 'Error updating category');
            reject(new Error('Failed to update category'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error updating category');
          reject(error);
        }
      });
    });
  }

  async deleteCategory(categoryId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.catalogService.deleteCategory(categoryId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Success', 'Category deactivated successfully');
            resolve(true);
          } else {
            this.toastService.error('Error', 'Failed to deactivate category');
            reject(new Error('Failed to delete category'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error deactivating category');
          reject(error);
        }
      });
    });
  }

  async hardDeleteCategory(categoryId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.catalogService.hardDeleteCategory(categoryId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Success', 'Category permanently deleted');
            resolve(true);
          } else {
            this.toastService.error('Error', 'Failed to permanently delete category');
            reject(new Error('Failed to hard delete category'));
          }
        },
        error: (error: any) => {
          // Error handling is done in the component
          reject(error);
        }
      });
    });
  }

  async updateCategoryStatus(categoryId: number, isActive: boolean): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Get the current category data first, then update with new status
      this.catalogService.getAllCategories().subscribe({
        next: (response: any) => {
          if (response.success) {
            const category = response.data.find((c: any) => c.category_id === categoryId);
            if (category) {
              const updateData = {
                name: category.name,
                description: category.description,
                image_url: category.image_url,
                is_active: isActive
              };
              
              this.catalogService.updateCategory(categoryId, updateData).subscribe({
                next: (updateResponse: any) => {
                  if (updateResponse.success) {
                    this.toastService.success('Success', 'Category status updated successfully');
                    resolve(true);
                  } else {
                    this.toastService.error('Error', 'Error updating category status');
                    reject(new Error('Failed to update category status'));
                  }
                },
                error: (error: any) => {
                  this.toastService.error('Error', 'Error updating category status');
                  reject(error);
                }
              });
            } else {
              this.toastService.error('Error', 'Category not found');
              reject(new Error('Category not found'));
            }
          } else {
            this.toastService.error('Error', 'Error loading category data');
            reject(new Error('Failed to load category data'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error loading category data');
          reject(error);
        }
      });
    });
  }

  // Subcategory Operations
  async loadSubcategories(): Promise<Subcategory[]> {
    return new Promise((resolve, reject) => {
      this.catalogService.getAllSubcategories().subscribe({
        next: (response: any) => {
          if (response.success) {
            resolve(response.data);
          } else {
            this.toastService.error('Error', 'Failed to load subcategories');
            reject(new Error('Failed to load subcategories'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error loading subcategories');
          reject(error);
        }
      });
    });
  }

  async createSubcategory(subcategoryData: any): Promise<Subcategory> {
    return new Promise((resolve, reject) => {
      this.catalogService.createSubcategory(subcategoryData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Success', 'Subcategory created successfully');
            resolve(response.data);
          } else {
            this.toastService.error('Error', 'Error creating subcategory');
            reject(new Error('Failed to create subcategory'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error creating subcategory');
          reject(error);
        }
      });
    });
  }

  async updateSubcategory(subcategoryId: number, subcategoryData: any): Promise<Subcategory> {
    return new Promise((resolve, reject) => {
      this.catalogService.updateSubcategory(subcategoryId, subcategoryData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Success', 'Subcategory updated successfully');
            resolve(response.data);
          } else {
            this.toastService.error('Error', 'Error updating subcategory');
            reject(new Error('Failed to update subcategory'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error updating subcategory');
          reject(error);
        }
      });
    });
  }

  async deleteSubcategory(subcategoryId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.catalogService.deleteSubcategory(subcategoryId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Success', 'Subcategory deactivated successfully');
            resolve(true);
          } else {
            this.toastService.error('Error', 'Failed to deactivate subcategory');
            reject(new Error('Failed to delete subcategory'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error deactivating subcategory');
          reject(error);
        }
      });
    });
  }

  async hardDeleteSubcategory(subcategoryId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.catalogService.hardDeleteSubcategory(subcategoryId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Success', 'Subcategory permanently deleted');
            resolve(true);
          } else {
            this.toastService.error('Error', 'Failed to permanently delete subcategory');
            reject(new Error('Failed to hard delete subcategory'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error permanently deleting subcategory');
          reject(error);
        }
      });
    });
  }

  async updateSubcategoryStatus(subcategoryId: number, isActive: boolean): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Get the current subcategory data first, then update with new status
      this.catalogService.getAllSubcategories().subscribe({
        next: (response: any) => {
          if (response.success) {
            const subcategory = response.data.find((s: any) => s.subcategory_id === subcategoryId);
            if (subcategory) {
              const updateData = {
                name: subcategory.name,
                description: subcategory.description,
                category_id: subcategory.category_id,
                image_url: subcategory.image_url,
                is_active: isActive
              };
              
              this.catalogService.updateSubcategory(subcategoryId, updateData).subscribe({
                next: (updateResponse: any) => {
                  if (updateResponse.success) {
                    this.toastService.success('Success', 'Subcategory status updated successfully');
                    resolve(true);
                  } else {
                    this.toastService.error('Error', 'Error updating subcategory status');
                    reject(new Error('Failed to update subcategory status'));
                  }
                },
                error: (error: any) => {
                  this.toastService.error('Error', 'Error updating subcategory status');
                  reject(error);
                }
              });
            } else {
              this.toastService.error('Error', 'Subcategory not found');
              reject(new Error('Subcategory not found'));
            }
          } else {
            this.toastService.error('Error', 'Error loading subcategory data');
            reject(new Error('Failed to load subcategory data'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error loading subcategory data');
          reject(error);
        }
      });
    });
  }

  // Product Operations
  async loadProducts(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      this.catalogService.getAllProducts().subscribe({
        next: (response: any) => {
          if (response.success) {
            resolve(response.data);
          } else {
            this.toastService.error('Error', 'Failed to load products');
            reject(new Error('Failed to load products'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error loading products');
          reject(error);
        }
      });
    });
  }

  async createProduct(productData: any): Promise<Product> {
    return new Promise((resolve, reject) => {
      this.catalogService.createProduct(productData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Success', 'Product created successfully');
            resolve(response.data);
          } else {
            this.toastService.error('Error', 'Error creating product');
            reject(new Error('Failed to create product'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error creating product');
          reject(error);
        }
      });
    });
  }

  async updateProduct(productId: string, productData: any): Promise<Product> {
    return new Promise((resolve, reject) => {
      this.catalogService.updateProduct(productId, productData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Success', 'Product updated successfully');
            resolve(response.data);
          } else {
            this.toastService.error('Error', 'Error updating product');
            reject(new Error('Failed to update product'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error updating product');
          reject(error);
        }
      });
    });
  }

  async deleteProduct(productId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.catalogService.deleteProduct(productId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.success('Success', 'Product permanently deleted');
            resolve(true);
          } else {
            this.toastService.error('Error', 'Failed to delete product');
            reject(new Error('Failed to delete product'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error deleting product');
          reject(error);
        }
      });
    });
  }

  async updateProductStatus(productId: string, isActive: boolean): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Get the current product data first, then update with new status
      this.catalogService.getAllProducts().subscribe({
        next: (response: any) => {
          if (response.success) {
            const product = response.data.find((p: any) => p.product_id === productId);
            if (product) {
              const updateData = {
                name: product.name,
                description: product.description,
                price: product.price,
                category_id: product.category_id,
                subcategory_id: product.subcategory_id,
                image_url: product.image_url,
                is_active: isActive
              };
              
              this.catalogService.updateProduct(productId, updateData).subscribe({
                next: (updateResponse: any) => {
                  if (updateResponse.success) {
                    this.toastService.success('Success', 'Product status updated successfully');
                    resolve(true);
                  } else {
                    this.toastService.error('Error', 'Error updating product status');
                    reject(new Error('Failed to update product status'));
                  }
                },
                error: (error: any) => {
                  this.toastService.error('Error', 'Error updating product status');
                  reject(error);
                }
              });
            } else {
              this.toastService.error('Error', 'Product not found');
              reject(new Error('Product not found'));
            }
          } else {
            this.toastService.error('Error', 'Error loading product data');
            reject(new Error('Failed to load product data'));
          }
        },
        error: (error: any) => {
          this.toastService.error('Error', 'Error loading product data');
          reject(error);
        }
      });
    });
  }
}
