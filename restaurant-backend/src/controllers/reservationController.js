import {
  createReservationService,
  getAllReservationsService,
  getReservationByIdService,
  updateReservationService,
  deleteReservationService,
  getReservationsByTableService,
  getTodayReservationsService,
  getReservationStatsService,
  getAdvancedFilteredReservationsService,
  getTableAvailabilityService,
  checkOverdueReservationsService,
  getOverdueReservationsService
} from '../models/reservationModel.js';

// Create reservation
export const createReservation = async (req, res) => {
  try {
    const reservationData = req.body;
    const createdBy = req.user.user_id; // From authentication middleware
    
    // Extract reservation data
    const { table_id, reservation_date, reservation_time, customer_id } = reservationData;
    
    const reservation = await createReservationService(reservationData, createdBy);
    
    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: reservation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all reservations with pagination
export const getAllReservations = async (req, res) => {
  try {
    const { page = 1, limit = 20, date } = req.query;
    const reservations = await getAllReservationsService(parseInt(page), parseInt(limit), date);
    
    res.json({
      success: true,
      message: 'Reservations retrieved successfully',
      data: reservations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await getReservationByIdService(id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Reservation retrieved successfully',
      data: reservation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update reservation
export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedBy = req.user.user_id;
    
    // Conflict checking is handled in the service layer
    
    const reservation = await updateReservationService(id, updateData, updatedBy);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Reservation updated successfully',
      data: reservation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete reservation
export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await deleteReservationService(id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Reservation deleted successfully',
      data: reservation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get reservations by table
export const getReservationsByTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { date } = req.query;
    
    const reservations = await getReservationsByTableService(tableId, date);
    
    res.json({
      success: true,
      message: 'Table reservations retrieved successfully',
      data: reservations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get today's reservations
export const getTodayReservations = async (req, res) => {
  try {
    const reservations = await getTodayReservationsService();
    
    res.json({
      success: true,
      message: 'Today\'s reservations retrieved successfully',
      data: reservations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get reservation statistics
export const getReservationStats = async (req, res) => {
  try {
    const stats = await getReservationStatsService();
    
    res.json({
      success: true,
      message: 'Reservation statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get advanced filtered reservations
export const getAdvancedFilteredReservations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      date,
      start_date,
      end_date,
      start_time,
      end_time,
      table_id,
      section_code,
      status,
      customer_name,
      customer_phone,
      party_size_min,
      party_size_max,
      created_by,
      sort_by = 'reservation_date',
      sort_order = 'desc'
    } = req.query;

    // Build filter object
    const filters = {};
    
    if (date) filters.date = date;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (start_time) filters.start_time = start_time;
    if (end_time) filters.end_time = end_time;
    if (table_id) filters.table_id = table_id;
    if (section_code) filters.section_code = section_code;
    if (status) filters.status = status;
    if (customer_name) filters.customer_name = customer_name;
    if (customer_phone) filters.customer_phone = customer_phone;
    if (party_size_min) filters.party_size_min = parseInt(party_size_min);
    if (party_size_max) filters.party_size_max = parseInt(party_size_max);
    if (created_by) filters.created_by = created_by;
    
    const sortOptions = {
      field: sort_by,
      order: sort_order === 'asc' ? 'ASC' : 'DESC'
    };

    const reservations = await getAdvancedFilteredReservationsService(
      parseInt(page),
      parseInt(limit),
      filters,
      sortOptions
    );
    
    res.json({
      success: true,
      message: 'Advanced filtered reservations retrieved successfully',
      data: reservations.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: reservations.total,
        total_pages: Math.ceil(reservations.total / parseInt(limit))
      },
      filters_applied: filters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get table availability with reservations
export const getTableAvailability = async (req, res) => {
  try {
    const { date, start_time, end_time, section_code } = req.query;
    
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const availability = await getTableAvailabilityService(date, start_time, end_time, section_code);
    
    res.json({
      success: true,
      message: 'Table availability retrieved successfully',
      data: availability
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Check and update overdue reservations
export const checkOverdueReservations = async (req, res) => {
  try {
    const overdueReservations = await checkOverdueReservationsService();
    
    res.json({
      success: true,
      message: 'Overdue reservations checked successfully',
      data: {
        count: overdueReservations.length,
        reservations: overdueReservations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get overdue reservations
export const getOverdueReservations = async (req, res) => {
  try {
    const overdueReservations = await getOverdueReservationsService();
    
    res.json({
      success: true,
      message: 'Overdue reservations retrieved successfully',
      data: overdueReservations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
