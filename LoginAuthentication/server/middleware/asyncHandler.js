// middleware/asyncHandler.js
// Wraps an async route/middleware function so any rejected promise or
// thrown error is forwarded to next(), instead of requiring a
// try/catch block in every single controller.

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
