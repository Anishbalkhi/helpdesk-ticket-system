const AppError = require('../utils/AppError');
const { isProduction, isTest } = require('../config/env');

function notFound(req, res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Request body is not valid JSON' });
  }

  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  if (err instanceof AppError) {
    const body = { success: false, message: err.message };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  // Unexpected error: log it, but never leak internals (stack traces, queries) to the client.
  if (!isTest) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  return res.status(500).json({
    success: false,
    message: isProduction ? 'Something went wrong' : err.message || 'Something went wrong',
  });
}

module.exports = { notFound, errorHandler };
