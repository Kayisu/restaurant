import Joi from 'joi';

// Customer validation schema
const customerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required'
  }),
  phone_number: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(20).required().messages({
    'string.pattern.base': 'Phone number must contain only numbers, spaces, hyphens, parentheses, and plus signs',
    'string.min': 'Phone number must be at least 10 characters long',
    'string.max': 'Phone number cannot exceed 20 characters',
    'any.required': 'Phone number is required'
  }),
  email: Joi.string().email().optional().allow(null, '').messages({
    'string.email': 'Email must be a valid email address'
  }),
  address: Joi.string().max(200).optional().allow(null, '')
});

// Update customer validation schema (all fields optional)
const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters'
  }),
  phone_number: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(20).optional().messages({
    'string.pattern.base': 'Phone number must contain only numbers, spaces, hyphens, parentheses, and plus signs',
    'string.min': 'Phone number must be at least 10 characters long',
    'string.max': 'Phone number cannot exceed 20 characters'
  }),
  email: Joi.string().email().optional().allow(null, '').messages({
    'string.email': 'Email must be a valid email address'
  }),
  address: Joi.string().max(200).optional().allow(null, '')
});

// Validate customer input
export const validateCustomerInput = (req, res, next) => {
  const schema = req.method === 'PUT' ? updateCustomerSchema : customerSchema;
  
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
