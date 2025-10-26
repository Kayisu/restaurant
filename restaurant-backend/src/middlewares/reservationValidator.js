import Joi from 'joi';

// Reservation validation schema
const reservationSchema = Joi.object({
  table_id: Joi.string().pattern(/^[A-Z]-[0-9]{2}$/).required().messages({
    'string.pattern.base': 'Table ID must be in format: A-01, B-02, etc.',
    'any.required': 'Table ID is required'
  }),
  party_size: Joi.number().integer().min(1).max(20).required().messages({
    'number.base': 'Party size must be a number',
    'number.integer': 'Party size must be an integer',
    'number.min': 'Party size must be at least 1',
    'number.max': 'Party size cannot exceed 20',
    'any.required': 'Party size is required'
  }),
  reservation_date: Joi.date().required().messages({
    'date.base': 'Reservation date must be a valid date',
    'any.required': 'Reservation date is required'
  }),
  reservation_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
    'string.pattern.base': 'Reservation time must be in format: HH:MM (24-hour)',
    'any.required': 'Reservation time is required'
  }),
  duration_hours: Joi.number().integer().min(1).max(12).default(2).messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be an integer',
    'number.min': 'Duration must be at least 1 hour',
    'number.max': 'Duration cannot exceed 12 hours'
  }),
  // Customer identification
  customer_id: Joi.number().integer().optional().allow(null).messages({
    'number.base': 'Customer ID must be a number'
  }),
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed', 'no_show').default('pending'),
  notes: Joi.string().max(500).optional().allow(null, '')
});

// Update reservation validation schema (all fields optional)
const updateReservationSchema = Joi.object({
  table_id: Joi.string().pattern(/^[A-Z]-[0-9]{2}$/).optional().messages({
    'string.pattern.base': 'Table ID must be in format: A-01, B-02, etc.'
  }),
  party_size: Joi.number().integer().min(1).max(20).optional().messages({
    'number.base': 'Party size must be a number',
    'number.integer': 'Party size must be an integer',
    'number.min': 'Party size must be at least 1',
    'number.max': 'Party size cannot exceed 20'
  }),
  reservation_date: Joi.date().optional().messages({
    'date.base': 'Reservation date must be a valid date'
  }),
  reservation_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().messages({
    'string.pattern.base': 'Reservation time must be in format: HH:MM (24-hour)'
  }),
  duration_hours: Joi.number().integer().min(1).max(12).optional().messages({
    'number.base': 'Duration must be a number',
    'number.integer': 'Duration must be an integer',
    'number.min': 'Duration must be at least 1 hour',
    'number.max': 'Duration cannot exceed 12 hours'
  }),
  customer_id: Joi.number().integer().optional().allow(null).messages({
    'number.base': 'Customer ID must be a number'
  }),
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed', 'no_show').optional(),
  notes: Joi.string().max(500).optional().allow(null, '')
});

// Validate reservation input
export const validateReservationInput = (req, res, next) => {
  const schema = req.method === 'PUT' ? updateReservationSchema : reservationSchema;
  
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }

  // Update request body with validated data
  req.body = value;
  next();
};
