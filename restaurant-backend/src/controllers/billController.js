import {
  getAllBillsService,
  getBillByIdService,
  getBillProductsService,
  createBillService,
  updateBillService,
  deleteBillService,
  addBillProductService,
  addBillMenuService,
  updateBillProductService,
  removeBillProductService,
  getBillsByCustomerService,
  getBillsByOrderService,
  generateBillNumberService,
  updateBillStatusService,
  completeBillService,
  cancelBillService
} from '../models/billModel.js';

// Get all bills
export const getAllBills = async (req, res) => {
  try {
    const bills = await getAllBillsService();
    res.status(200).json({
      success: true,
      message: 'Bills retrieved successfully',
      data: bills
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving bills',
    });
  }
};

export const getBillById = async (req, res) => {
  try {
    const { billId } = req.params;
    const bill = await getBillByIdService(billId);
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Get bill products
    const products = await getBillProductsService(billId);
    
    res.status(200).json({
      success: true,
      message: 'Bill retrieved successfully',
      data: {
        ...bill,
        products
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving bill',
    });
  }
};

// Create bill
export const createBill = async (req, res) => {
  try {
    const billData = req.body;
    
    // Generate bill number if not provided
    if (!billData.bill_number) {
      billData.bill_number = await generateBillNumberService();
    }

    const bill = await createBillService(billData);
    
    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: bill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating bill',
    });
  }
};

// Update bill
export const updateBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const updateData = req.body;
    
    const bill = await updateBillService(billId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Bill updated successfully',
      data: bill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating bill',
    });
  }
};

// Delete bill
export const deleteBill = async (req, res) => {
  try {
    const { billId } = req.params;
    
    const bill = await deleteBillService(billId);
    
    res.status(200).json({
      success: true,
      message: 'Bill deleted successfully',
      data: bill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting bill',
    });
  }
};

// Add product to bill
export const addBillProduct = async (req, res) => {
  try {
    const { billId } = req.params;
    const productData = req.body;
    
    const billProduct = await addBillProductService(billId, productData);
    
    res.status(201).json({
      success: true,
      message: 'Product added to bill successfully',
      data: billProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error adding product to bill',
    });
  }
};

// Add menu to bill
export const addBillMenu = async (req, res) => {
  try {
    const { billId } = req.params;
    const menuData = req.body;
    
    const billMenu = await addBillMenuService(billId, menuData);
    
    res.status(201).json({
      success: true,
      message: 'Menu added to bill successfully',
      data: billMenu
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error adding menu to bill',
    });
  }
};

// Update bill product
export const updateBillProduct = async (req, res) => {
  try {
    const { billProductId } = req.params;
    const updateData = req.body;
    
    const billProduct = await updateBillProductService(billProductId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Bill product updated successfully',
      data: billProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating bill product',
    });
  }
};

// Remove product from bill
export const removeBillProduct = async (req, res) => {
  try {
    const { billProductId } = req.params;
    
    const billProduct = await removeBillProductService(billProductId);
    
    res.status(200).json({
      success: true,
      message: 'Product removed from bill successfully',
      data: billProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error removing product from bill',
    });
  }
};

// Get bills by customer
export const getBillsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const bills = await getBillsByCustomerService(customerId);
    
    res.status(200).json({
      success: true,
      message: 'Customer bills retrieved successfully',
      data: bills
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving customer bills',
    });
  }
};

// Get bills by order
export const getBillsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const bills = await getBillsByOrderService(orderId);
    
    res.status(200).json({
      success: true,
      message: 'Order bills retrieved successfully',
      data: bills
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving order bills',
    });
  }
};

// Generate bill number
export const generateBillNumber = async (req, res) => {
  try {
    const billNumber = await generateBillNumberService();
    
    res.status(200).json({
      success: true,
      message: 'Bill number generated successfully',
      data: { bill_number: billNumber }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating bill number',
    });
  }
};

// Update bill status
export const updateBillStatus = async (req, res) => {
  try {
    const { billId } = req.params;
    const { status } = req.body;
    
    const bill = await updateBillStatusService(billId, status);
    
    res.status(200).json({
      success: true,
      message: 'Bill status updated successfully',
      data: bill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating bill status',
    });
  }
};

// Complete bill
export const completeBill = async (req, res) => {
  try {
    const { billId } = req.params;
    
    const bill = await completeBillService(billId);
    
    res.status(200).json({
      success: true,
      message: 'Bill completed successfully',
      data: bill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error completing bill',
    });
  }
};

// Cancel bill
export const cancelBill = async (req, res) => {
  try {
    const { billId } = req.params;
    
    const bill = await cancelBillService(billId);
    
    res.status(200).json({
      success: true,
      message: 'Bill cancelled successfully',
      data: bill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error cancelling bill',
    });
  }
};
