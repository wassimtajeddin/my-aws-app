const { logger } = require('../config/database')

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id']
  })
  
  const errorResponse = {
    success: false,
    error: 'Internal server error',
    requestId: req.headers['x-request-id'] || null,
    timestamp: new Date().toISOString()
  }
  
  if (err.name === 'SequelizeValidationError') {
    errorResponse.error = 'Validation error'
    errorResponse.details = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }))
    return res.status(400).json(errorResponse)
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    errorResponse.error = 'Duplicate entry'
    errorResponse.details = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }))
    return res.status(409).json(errorResponse)
  }
  
  if (err.name === 'SequelizeDatabaseError') {
    errorResponse.error = 'Database error'
    return res.status(500).json(errorResponse)
  }
  
  if (err.name === 'SequelizeConnectionError') {
    errorResponse.error = 'Database connection error'
    return res.status(503).json(errorResponse)
  }
  
  if (err.status === 404) {
    errorResponse.error = 'Resource not found'
    return res.status(404).json(errorResponse)
  }
  
  if (err.status === 401) {
    errorResponse.error = 'Unauthorized'
    return res.status(401).json(errorResponse)
  }
  
  if (err.status === 403) {
    errorResponse.error = 'Forbidden'
    return res.status(403).json(errorResponse)
  }
  
  if (err.name === 'RateLimitError') {
    errorResponse.error = 'Too many requests'
    errorResponse.retryAfter = err.retryAfter
    return res.status(429).json(errorResponse)
  }
  
  if (err.name === 'ValidationError') {
    errorResponse.error = 'Validation failed'
    errorResponse.details = err.details || err.message
    return res.status(400).json(errorResponse)
  }
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack
    errorResponse.message = err.message
  }
  
  res.status(err.status || 500).json(errorResponse)
}

module.exports = errorHandler