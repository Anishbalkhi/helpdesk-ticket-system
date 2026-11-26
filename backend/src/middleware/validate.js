const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/**
 * validate(schema, 'body' | 'query') — parses the request part with a zod schema.
 * On success the parsed (trimmed, defaulted, unknown-keys-stripped) value replaces
 * the original, so controllers only ever see clean data.
 */
const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(AppError.badRequest('Validation failed', errors));
    }
    if (source === 'query') {
      // req.query is a getter in some Express versions; store parsed values separately.
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }
    return next();
  };

// Rejects malformed MongoDB ids with 400 instead of letting Mongoose throw a CastError.
const validateObjectId =
  (param = 'id') =>
  (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[param])) {
      return next(AppError.badRequest(`Invalid ${param === 'id' ? 'ticket' : param} id`));
    }
    return next();
  };

module.exports = { validate, validateObjectId };
