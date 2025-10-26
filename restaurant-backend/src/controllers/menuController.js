import {
 // Menu CRUD
 createMenuService,
 updateMenuService,
 deleteMenuService,
 getMenuByIdAdminService,
 getAllMenusService,
 getAllMenusForAdminService,
 addProductToMenuService,
 removeProductFromMenuService,
 updateMenuProductQuantityService,
 getMenuItemsWithCalculatedPriceService,
 getAllMenuItemsService,
 // Hard delete
 hardDeleteMenuService
} from "../models/menuModel.js";

// Create menu
export const createMenu = async (req, res) => {
    try {
      const { menu_name, description, price, image_url, preparation_time } = req.body;
      const userId = req.user.user_id;
  
      if (!menu_name || !price) {
        return res.status(400).json({
          success: false,
          message: 'Menu name and price are required'
        });
      }
  
      if (price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be greater than 0'
        });
      }
  
      const menu = await createMenuService({
        menu_name,
        description,
        price,
        image_url,
        preparation_time
      }, userId);
  
      res.status(201).json({
        success: true,
        message: 'Menu created successfully',
        data: menu
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating menu',
      });
    }
  };
  
  // Update menu
  export const updateMenu = async (req, res) => {
    try {
      const { menuId } = req.params;
      const { menu_name, description, price, image_url, preparation_time, is_available } = req.body;
      const userId = req.user.user_id;
  
      if (price !== undefined && price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be greater than 0'
        });
      }
  
      const menu = await updateMenuService(menuId, {
        menu_name,
        description,
        price,
        image_url,
        preparation_time,
        is_available
      }, userId);
  
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menu not found'
        });
      }
  
      res.json({
        success: true,
        message: 'Menu updated successfully',
        data: menu
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating menu',
      });
    }
  };
  
  // Delete menu
  export const deleteMenu = async (req, res) => {
    try {
      const { menuId } = req.params;
      const userId = req.user.user_id;
  
      const menu = await deleteMenuService(menuId, userId);
  
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menu not found'
        });
      }
  
      res.json({
        success: true,
        message: 'Menu deleted successfully',
        data: menu
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting menu',
      });
    }
  };
  
  export const getMenuByIdAdmin = async (req, res) => {
    try {
      const { menuId } = req.params;
      const menu = await getMenuByIdAdminService(menuId);
  
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menu not found'
        });
      }
  
      res.json({
        success: true,
        data: menu
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting menu',
      });
    }
  };
  
  // Get all active menus (staff/public)
  export const getAllMenus = async (req, res) => {
    try {
      const menus = await getAllMenusService();
      res.json({
        success: true,
        data: menus
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting active menus',
      });
    }
  };

  // Get all menus including inactive (admin only)
  export const getAllMenusAdmin = async (req, res) => {
    try {
      const menus = await getAllMenusForAdminService();
      res.json({
        success: true,
        data: menus
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting all menus',
      });
    }
  };
  
  // =========================================
  // =========================================
  
  // Add product to menu
  export const addProductToMenu = async (req, res) => {
    try {
      const { menuId } = req.params;
      const { product_id, quantity } = req.body;
      const userId = req.user.user_id;
  
      if (!product_id || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'Product ID and quantity are required'
        });
      }
  
      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }
  
      const menuItem = await addProductToMenuService(menuId, product_id, quantity, userId);
  
      res.status(201).json({
        success: true,
        message: 'Product added to menu successfully',
        data: menuItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error adding product to menu',
      });
    }
  };
  
  // Remove product from menu
  export const removeProductFromMenu = async (req, res) => {
    try {
      const { menuId, productId } = req.params;
  
      const menuItem = await removeProductFromMenuService(menuId, productId);
  
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Product not found in menu'
        });
      }
  
      res.json({
        success: true,
        message: 'Product removed from menu successfully',
        data: menuItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error removing product from menu',
      });
    }
  };
  
  // Update product quantity in menu
  export const updateMenuProductQuantity = async (req, res) => {
    try {
      const { menuId, productId } = req.params;
      const { quantity } = req.body;
      const userId = req.user.user_id;
  
      if (!quantity) {
        return res.status(400).json({
          success: false,
          message: 'Quantity is required'
        });
      }
  
      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }
  
      const menuItem = await updateMenuProductQuantityService(menuId, productId, quantity, userId);
  
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Product not found in menu'
        });
      }
  
      res.json({
        success: true,
        message: 'Product quantity updated successfully',
        data: menuItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating product quantity',
      });
    }
  };
  
  // Get menu items with calculated price
  export const getMenuItemsWithCalculatedPrice = async (req, res) => {
    try {
      const { menuId } = req.params;
      const menuInfo = await getMenuItemsWithCalculatedPriceService(menuId);
  
      if (!menuInfo) {
        return res.status(404).json({
          success: false,
          message: 'Menu not found'
        });
      }
  
      res.json({
        success: true,
        data: menuInfo
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting menu items with calculated price',
      });
    }
  };
  
  // Get all menu items for a menu (admin)
  export const getAllMenuItems = async (req, res) => {
    try {
      const { menuId } = req.params;
      const menuData = await getAllMenuItemsService(menuId);
  
      if (!menuData.menu_info) {
        return res.status(404).json({
          success: false,
          message: 'Menu not found'
        });
      }
  
      res.json({
        success: true,
        data: menuData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error getting all menu items',
      });
    }
  };

// =========================================
// Hard delete menu (permanently delete)
export const hardDeleteMenu = async (req, res) => {
  try {
    const { menuId } = req.params;
    
    if (!menuId || isNaN(menuId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid menu ID is required'
      });
    }
    
    const deletedMenu = await hardDeleteMenuService(parseInt(menuId));
    
    res.json({
      success: true,
      message: 'Menu permanently deleted',
      data: deletedMenu
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
      message: 'Error hard deleting menu',
    });
  }
};
  