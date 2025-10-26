import Joi from 'joi';

const userScheme = Joi.object({
  user_name: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(50).required(), 
  role_id: Joi.number().integer().min(1).required(),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().optional().allow(null, '')
});

const loginScheme = Joi.object({
  user_name: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(50).required()
});

const updateOwnCredentialsScheme = Joi.object({
  current_password: Joi.string().min(6).max(50).optional(),
  new_password: Joi.string().min(6).max(50).optional(),
  user_name: Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().optional().allow(null, '')
}).min(1);

const adminUpdateCredentialsScheme = Joi.object({
  user_name: Joi.string().min(3).max(50).optional(),
  password: Joi.string().min(6).max(50).optional(),
  role_id: Joi.number().integer().min(1).optional(),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().optional().allow(null, '')
}).min(1);

const validateUser = (req, res, next) => {
  const { error } = userScheme.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: error.details[0].message
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginScheme.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: error.details[0].message
    });
  }
  next();
};

const validateUpdateOwnCredentials = (req, res, next) => {
  const { error } = updateOwnCredentialsScheme.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: error.details[0].message
    });
  }
  next();
};

const validateAdminUpdateCredentials = (req, res, next) => {
  const { error } = adminUpdateCredentialsScheme.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 400,
      message: error.details[0].message
    });
  }
  next();
};

// Table validation schemas
const createTableSchema = Joi.object({
  table_id: Joi.string()
    .pattern(/^[A-Z]-[0-9]{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'Table ID must be in format: A-01, B-02, etc.',
      'any.required': 'Table ID is required'
    }),
  capacity: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .required()
    .messages({
      'number.base': 'Capacity must be a number',
      'number.integer': 'Capacity must be an integer',
      'number.min': 'Capacity must be at least 1',
      'number.max': 'Capacity cannot exceed 20',
      'any.required': 'Capacity is required'
    }),
  assigned_server: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Assigned server must be a number',
      'number.integer': 'Assigned server must be an integer',
      'number.positive': 'Assigned server must be a positive number'
    })
});

// Table update validation schema
const updateTableSchema = Joi.object({
  capacity: Joi.number().integer().min(1).max(20).optional(),
  assigned_server: Joi.number().integer().positive().optional().allow(null)
});

// Table validation middleware
export const validateCreateTable = (req, res, next) => {

  
  const { error } = createTableSchema.validate(req.body);
  
  if (error) {

    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      error: "NotNullError"
    });
  }
  
  next();
};

export const validateUpdateTable = (req, res, next) => {
  const { error } = updateTableSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map(detail => detail.message)
    });
  }
  
  next();
};

export { 
  validateUser, 
  validateLogin, 
  validateUpdateOwnCredentials, 
  validateAdminUpdateCredentials 
};