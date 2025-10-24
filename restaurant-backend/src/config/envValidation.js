/**
 * Environment Variable Validation
 * Validates required environment variables on application startup
 */

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT', 
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET'
];

const optionalEnvVars = [
  'NODE_ENV',
  'PORT',
  'ALLOWED_ORIGINS'
];

export const validateEnvironmentVariables = () => {
  const missing = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check optional variables and warn if missing
  optionalEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });

  // Throw error if required variables are missing
  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    console.error('Environment validation failed:', errorMessage);
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  // Log warnings for optional variables
  if (warnings.length > 0) {
    console.warn('Optional environment variables not set:', warnings.join(', '));
    console.warn('Using default values where applicable.');
  }

  console.log('Environment variables validated successfully');
  return true;
};

export const getEnvWithDefaults = () => {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5001,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:4200'
  };
};
