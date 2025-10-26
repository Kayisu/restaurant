import {
  getAllTablesService,
  getTableByIdService,
  createTableService,
  deleteTableService,
  updateTableService,
  updateTableStatusService,
  updateTableReservationService,
  clearTableCustomerService,
  getDashboardStatsService,
  getTableSectionsService,
  getSectionSummaryService,
  getSectionTablesService
} from "../models/tableModel.js";

export const getAllTables = async (req, res, next) => {
  try {
    const tables = await getAllTablesService();
    res.json({
      success: true,
      message: "Tables retrieved successfully",
      data: tables
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await getDashboardStatsService();
    res.json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard debug endpoint
export const getDashboardDebug = async (req, res) => {
  try {
    const user = req.user;
    const stats = await getDashboardStatsService();
    const tables = await getAllTablesService();
    
    res.json({
      success: true,
      message: "Dashboard debug data retrieved successfully",
      data: {
        user: {
          userId: user.userId,
          userName: user.user_name,
          roleId: user.role_id
        },
        stats,
        tablesCount: tables.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Dashboard debug failed",
      error: error.message
    });
  }
};

export const getTableSections = async (req, res, next) => {
  try {
    const sections = await getTableSectionsService();
    res.json({
      success: true,
      message: "Table sections retrieved successfully",
      data: sections
    });
  } catch (error) {
    next(error);
  }
};

export const getSectionSummary = async (req, res, next) => {
  try {
    const summary = await getSectionSummaryService();
    res.json({
      success: true,
      message: "Section summary retrieved successfully",
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

export const getSectionTables = async (req, res, next) => {
  const { sectionCode } = req.params;

  try {
    const tables = await getSectionTablesService(sectionCode);

    if (tables.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No tables found in this section"
      });
    }

    res.json({
      success: true,
      message: `Tables in section ${sectionCode} retrieved successfully`,
      data: tables
    });
  } catch (error) {
    next(error);
  }
};

export const getTableById = async (req, res, next) => {
  const { tableId } = req.params;

  try {
    const table = await getTableByIdService(tableId);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found"
      });
    }

    res.json({
      success: true,
      message: "Table details retrieved successfully",
      data: table
    });
  } catch (error) {
    next(error);
  }
};

export const createTable = async (req, res, next) => {
  try {
    const tableData = req.body;
    
    const newTable = await createTableService(tableData);

    res.status(201).json({
      success: true,
      message: "Table created successfully",
      data: newTable
    });
  } catch (error) {

    
    // Handle specific validation errors
    if (error.message.includes('Invalid table ID format') || 
        error.message.includes('Invalid capacity') ||
        error.message.includes('already exists') ||
        error.message.includes('Invalid server ID')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};

export const deleteTable = async (req, res, next) => {
  const { tableId } = req.params;

  try {
    const deletedTable = await deleteTableService(tableId);

    res.json({
      success: true,
      message: `Table ${tableId} and all related data deleted successfully`,
      data: deletedTable
    });
  } catch (error) {
    
    // Handle specific business logic errors
    if (error.message.includes('not found') ||
        error.message.includes('currently occupied') ||
        error.message.includes('currently reserved') ||
        error.message.includes('active bill')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};

export const updateTableStatus = async (req, res, next) => {
  const { tableId } = req.params;
  const statusData = req.body;

  try {
    const updatedTable = await updateTableStatusService(tableId, statusData);

    res.json({
      success: true,
      message: "Table status updated successfully",
      data: updatedTable
    });
  } catch (error) {
   
    
    // Handle specific validation errors
    if (error.message.includes('not found') ||
        error.message.includes('cannot be both occupied and reserved') ||
        error.message.includes('Invalid server ID')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};

export const updateTableReservationStatus = async (req, res, next) => {
  const { tableId } = req.params;
  const reservationData = req.body;

  try {
    const updatedTable = await updateTableReservationService(tableId, reservationData);

    res.json({
      success: true,
      message: "Table reservation status updated",
      data: updatedTable
    });
  } catch (error) {
  
    
    // Handle specific validation errors
    if (error.message.includes('not found') ||
        error.message.includes('Invalid server ID')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};

export const updateTable = async (req, res, next) => {
  const { tableId } = req.params;
  const updateData = req.body;

  try {
    const updatedTable = await updateTableService(tableId, updateData);
    
    res.json({
      success: true,
      message: `Table ${tableId} updated successfully`,
      data: updatedTable
    });
  } catch (error) {
 
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};

export const clearTableCustomer = async (req, res, next) => {
  const { tableId } = req.params;

  try {
    const clearedTable = await clearTableCustomerService(tableId);

    res.json({
      success: true,
      message: `Table ${tableId} cleared successfully`,
      data: clearedTable
    });
  } catch (error) {
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    next(error);
  }
};


export const getTableOrders = async (req, res, next) => {
  res.json({
    success: true,
    message: "Table orders endpoint - to be implemented",
    data: []
  });
};

export const createTableOrder = async (req, res, next) => {
  res.json({
    success: true,
    message: "Create table order endpoint - to be implemented",
    data: {}
  });
};

export const getActiveTableOrder = async (req, res, next) => {
  res.json({
    success: true,
    message: "Active table order endpoint - to be implemented",
    data: null
  });
};
