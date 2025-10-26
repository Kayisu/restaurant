import {
  createCustomerService,
  getAllCustomersService,
  getCustomerByIdService,
  updateCustomerService,
  deleteCustomerService,
  searchCustomersService,
  getCustomerStatsService,
} from '../models/customerModel.js';

// Create customer
export const createCustomer = async (req, res) => {
  try {
    const customer = await createCustomerService(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all customers with pagination
export const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const customers = await getAllCustomersService(parseInt(page), parseInt(limit), search);
    
    res.json({
      success: true,
      message: 'Customers retrieved successfully',
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await getCustomerByIdService(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Customer retrieved successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const customer = await updateCustomerService(id, updateData);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await deleteCustomerService(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Customer deleted successfully',
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Search customers
export const searchCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const customers = await searchCustomersService(search);
    
    res.json({
      success: true,
      message: 'Customers search completed',
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get customer statistics
export const getCustomerStats = async (req, res) => {
  try {
    const stats = await getCustomerStatsService();
    
    res.json({
      success: true,
      message: 'Customer statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
