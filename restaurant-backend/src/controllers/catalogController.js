import {
  getCategoriesService,
  getCategorySubcategoriesService,
  getSubcategoryProductsService,
  getActiveProductsService,
  searchProductsService,
  getProductByIdService,
  getProductOptionsService,
  // Category CRUD
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  getCategoryByIdService,
  getAllCategoriesService,
  // Subcategory CRUD
  createSubcategoryService,
  updateSubcategoryService,
  deleteSubcategoryService,
  getSubcategoryByIdService,
  getAllSubcategoriesService,
  // Product CRUD
  createProductService,
  updateProductService,
  deleteProductService,
  getProductByIdAdminService,
  getAllProductsService,
  // Hard delete operations
  hardDeleteCategoryService,
  hardDeleteSubcategoryService,
  hardDeleteProductService
} from "../models/catalogModel.js";

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await getCategoriesService();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting categories',
    });
  }
};

// Get subcategories for a category
export const getCategorySubcategories = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const subcategories = await getCategorySubcategoriesService(categoryId);
    res.json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting subcategories',
    });
  }
};

// Get products for a subcategory
export const getSubcategoryProducts = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const products = await getSubcategoryProductsService(subcategoryId);
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting subcategory products',
    });
  }
};

// Get all active products
export const getActiveProducts = async (req, res) => {
  try {
    const products = await getActiveProductsService();
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting active products',
    });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    const products = await searchProductsService(q);
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching products',
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await getProductByIdService(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting product',
    });
  }
};

// Get product options
export const getProductOptions = async (req, res) => {
  try {
    const { productId } = req.params;
    const options = await getProductOptionsService(productId);
    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting product options',
    });
  }
};

// Create category
export const createCategory = async (req, res) => {
  try {
    const { name, description, image_url } = req.body;
    const userId = req.user.user_id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const category = await createCategoryService({
      name,
      description,
      image_url
    }, userId);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating category',
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, image_url, is_active } = req.body;
    const userId = req.user.user_id;

    const category = await updateCategoryService(categoryId, {
      name,
      description,
      image_url,
      is_active
    }, userId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating category',
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user.user_id;

    const category = await deleteCategoryService(categoryId, userId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await getCategoryByIdService(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting category',
    });
  }
};

// Get all categories (admin - including inactive)
export const getAllCategories = async (req, res) => {
  try {
    const categories = await getAllCategoriesService();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting all categories',
    });
  }
};

// =========================================
// Create subcategory
export const createSubcategory = async (req, res) => {
  try {
    const { category_id, name, description, image_url } = req.body;
    const userId = req.user.user_id;

    if (!category_id || !name) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and subcategory name are required'
      });
    }

    const subcategory = await createSubcategoryService({
      category_id,
      name,
      description,
      image_url
    }, userId);

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: subcategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating subcategory',
    });
  }
};

// Update subcategory
export const updateSubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const { name, description, image_url, is_active } = req.body;
    const userId = req.user.user_id;

    const subcategory = await updateSubcategoryService(subcategoryId, {
      name,
      description,
      image_url,
      is_active
    }, userId);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    res.json({
      success: true,
      message: 'Subcategory updated successfully',
      data: subcategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating subcategory',
    });
  }
};

// Delete subcategory
export const deleteSubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const userId = req.user.user_id;

    const subcategory = await deleteSubcategoryService(subcategoryId, userId);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    res.json({
      success: true,
      message: 'Subcategory deleted successfully',
      data: subcategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting subcategory',
    });
  }
};

export const getSubcategoryById = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const subcategory = await getSubcategoryByIdService(subcategoryId);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    res.json({
      success: true,
      data: subcategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting subcategory',
    });
  }
};

// Get all subcategories (admin - including inactive)
export const getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await getAllSubcategoriesService();
    res.json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting all subcategories',
    });
  }
};

// Create product
export const createProduct = async (req, res) => {
  try {
    const { subcategory_id, name, description, price, image_url, preparation_time } = req.body;
    const userId = req.user.user_id;

    if (!subcategory_id || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory ID, product name and price are required'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    const product = await createProductService({
      subcategory_id,
      name,
      description,
      price,
      image_url,
      preparation_time
    }, userId);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating product',
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price, image_url, preparation_time, is_available } = req.body;
    const userId = req.user.user_id;

    if (price !== undefined && price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    const product = await updateProductService(productId, {
      name,
      description,
      price,
      image_url,
      preparation_time,
      is_available
    }, userId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product',
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.user_id;

    const product = await deleteProductService(productId, userId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
    });
  }
};

export const getProductByIdAdmin = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await getProductByIdAdminService(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting product',
    });
  }
};

// Get all products (admin - including inactive)
export const getAllProducts = async (req, res) => {
  try {
    const products = await getAllProductsService();
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting all products',
    });
  }
};
// Hard delete category (permanently delete)
export const hardDeleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid category ID is required'
      });
    }
    
    const deletedCategory = await hardDeleteCategoryService(parseInt(id));
    
    res.json({
      success: true,
      message: 'Category permanently deleted',
      data: deletedCategory
    });
    
  } catch (error) {
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error hard deleting category',
    });
  }
};

// Hard delete subcategory (permanently delete)
export const hardDeleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid subcategory ID is required'
      });
    }
    
    const deletedSubcategory = await hardDeleteSubcategoryService(parseInt(id));
    
    res.json({
      success: true,
      message: 'Subcategory permanently deleted',
      data: deletedSubcategory
    });
    
  } catch (error) {
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error hard deleting subcategory',
    });
  }
};

// Hard delete product (permanently delete)
export const hardDeleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID is required'
      });
    }
    
    const deletedProduct = await hardDeleteProductService(productId);
    
    res.json({
      success: true,
      message: 'Product permanently deleted',
      data: deletedProduct
    });
    
  } catch (error) {
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error hard deleting product',
    });
  }
};

