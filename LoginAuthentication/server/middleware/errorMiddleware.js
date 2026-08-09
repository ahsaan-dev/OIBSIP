// middleware/errorMiddleware.js
// Two pieces of middleware:
//   1. notFound     -> catches requests to routes that don't exist
//   2. errorHandler -> the single place all errors are formatted for
//                       the client, so controllers can just throw.

const notFound = (req, res, next) => {
  const error = new Error(`Route not found — ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Translates common Mongoose/JWT error types into clean, predictable
// API responses instead of leaking stack traces to the client.
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server';
  let errors; // field-level validation errors, when available

  // Mongoose validation error (e.g. missing/invalid field)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
  }

  // Mongoose duplicate key error (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || { field: 'field' })[0];
    message = `An account with that ${field} already exists`;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired — please log in again';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    // Only expose the stack trace outside of production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = { notFound, errorHandler };
