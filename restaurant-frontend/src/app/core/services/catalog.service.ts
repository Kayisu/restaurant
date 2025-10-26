import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Category, Subcategory, Product, ProductOption } from '../../shared/interfaces';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Categories
  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.baseUrl}/catalog/categories`, {
      withCredentials: true
    });
  }

  // Subcategories
  getCategorySubcategories(categoryId: number): Observable<ApiResponse<Subcategory[]>> {
    return this.http.get<ApiResponse<Subcategory[]>>(`${this.baseUrl}/catalog/categories/${categoryId}/subcategories`, {
      withCredentials: true
    });
  }

  // Products
  getSubcategoryProducts(subcategoryId: number): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.baseUrl}/catalog/subcategories/${subcategoryId}/products`, {
      withCredentials: true
    });
  }

  getActiveProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.baseUrl}/catalog/products/active`, {
      withCredentials: true
    });
  }

  getProductById(productId: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/catalog/products/${productId}`, {
      withCredentials: true
    });
  }

  getProductOptions(productId: string): Observable<ApiResponse<ProductOption[]>> {
    return this.http.get<ApiResponse<ProductOption[]>>(`${this.baseUrl}/catalog/products/${productId}/options`, {
      withCredentials: true
    });
  }

  // Search
  searchProducts(query: string): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.baseUrl}/catalog/products/search?query=${encodeURIComponent(query)}`, {
      withCredentials: true
    });
  }

  // =========================================
  // CATEGORY CRUD OPERATIONS
  // =========================================

  // Get all categories (admin - including inactive)
  getAllCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.baseUrl}/catalog/categories/all`, {
      withCredentials: true
    });
  }

  // Get category by ID (admin)
  getCategoryById(categoryId: number): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.baseUrl}/catalog/categories/${categoryId}`, {
      withCredentials: true
    });
  }

  // Create category (admin)
  createCategory(categoryData: any): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.baseUrl}/catalog/categories`, categoryData, {
      withCredentials: true
    });
  }

  // Update category (admin)
  updateCategory(categoryId: number, categoryData: any): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.baseUrl}/catalog/categories/${categoryId}`, categoryData, {
      withCredentials: true
    });
  }

  // Delete category (admin)
  deleteCategory(categoryId: number): Observable<ApiResponse<Category>> {
    const url = `${this.baseUrl}/catalog/categories/${categoryId}`;
    return this.http.delete<ApiResponse<Category>>(url, {
      withCredentials: true
    });
  }

  hardDeleteCategory(categoryId: number): Observable<ApiResponse<Category>> {
    const url = `${this.baseUrl}/catalog/categories/${categoryId}/hard`;
    return this.http.delete<ApiResponse<Category>>(url, {
      withCredentials: true
    });
  }

  // =========================================
  // SUBCATEGORY CRUD OPERATIONS
  // =========================================

  // Get all subcategories (admin - including inactive)
  getAllSubcategories(): Observable<ApiResponse<Subcategory[]>> {
    return this.http.get<ApiResponse<Subcategory[]>>(`${this.baseUrl}/catalog/subcategories`, {
      withCredentials: true
    });
  }

  // Get subcategory by ID (admin)
  getSubcategoryById(subcategoryId: number): Observable<ApiResponse<Subcategory>> {
    return this.http.get<ApiResponse<Subcategory>>(`${this.baseUrl}/catalog/subcategories/${subcategoryId}`, {
      withCredentials: true
    });
  }

  // Create subcategory (admin)
  createSubcategory(subcategoryData: any): Observable<ApiResponse<Subcategory>> {
    return this.http.post<ApiResponse<Subcategory>>(`${this.baseUrl}/catalog/subcategories`, subcategoryData, {
      withCredentials: true
    });
  }

  // Update subcategory (admin)
  updateSubcategory(subcategoryId: number, subcategoryData: any): Observable<ApiResponse<Subcategory>> {
    return this.http.put<ApiResponse<Subcategory>>(`${this.baseUrl}/catalog/subcategories/${subcategoryId}`, subcategoryData, {
      withCredentials: true
    });
  }

  // Delete subcategory (admin)
  deleteSubcategory(subcategoryId: number): Observable<ApiResponse<Subcategory>> {
    return this.http.delete<ApiResponse<Subcategory>>(`${this.baseUrl}/catalog/subcategories/${subcategoryId}`, {
      withCredentials: true
    });
  }

  hardDeleteSubcategory(subcategoryId: number): Observable<ApiResponse<Subcategory>> {
    const url = `${this.baseUrl}/catalog/subcategories/${subcategoryId}/hard`;
    return this.http.delete<ApiResponse<Subcategory>>(url, {
      withCredentials: true
    });
  }

  // =========================================
  // PRODUCT CRUD OPERATIONS
  // =========================================

  // Get all products (admin - including inactive)
  getAllProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.baseUrl}/catalog/products`, {
      withCredentials: true
    });
  }

  // Get product by ID (admin)
  getProductByIdAdmin(productId: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/catalog/products/${productId}/admin`, {
      withCredentials: true
    });
  }

  // Create product (admin)
  createProduct(productData: any): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.baseUrl}/catalog/products`, productData, {
      withCredentials: true
    });
  }

  // Update product (admin)
  updateProduct(productId: string, productData: any): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.baseUrl}/catalog/products/${productId}`, productData, {
      withCredentials: true
    });
  }

  // Delete product (admin - hard delete)
  deleteProduct(productId: string): Observable<ApiResponse<Product>> {
    return this.http.delete<ApiResponse<Product>>(`${this.baseUrl}/catalog/products/${productId}/hard`, {
      withCredentials: true
    });
  }
}
