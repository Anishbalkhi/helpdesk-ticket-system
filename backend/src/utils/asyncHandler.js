// Express 4 does not catch rejected promises, so wrap async route handlers
// and forward any error to the central error handler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
