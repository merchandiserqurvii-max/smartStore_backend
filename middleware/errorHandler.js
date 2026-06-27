const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  // PostgreSQL unique-violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry — record already exists',
      errors:  [err.detail],
    });
  }

  // PostgreSQL not-null violation
  if (err.code === '23502') {
    return res.status(400).json({
      success: false,
      message: `Missing required field: ${err.column}`,
      errors:  [err.detail],
    });
  }

  // PostgreSQL invalid input (e.g. bad uuid / type)
  if (err.code === '22P02') {
    return res.status(400).json({
      success: false,
      message: 'Invalid input format',
      errors:  [err.message],
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors:  err.errors,
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors:  [],
  });
};

module.exports = globalErrorHandler;
