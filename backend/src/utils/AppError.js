/**
 * An error we expect and want to show to the client (wrong input, no access, ...).
 * Anything that is NOT an AppError is treated as a bug and returned as a generic 500.
 */
class AppError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message, errors) {
    return new AppError(400, message, errors);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(401, message);
  }

  static forbidden(message = 'You are not allowed to do this') {
    return new AppError(403, message);
  }

  static notFound(message = 'Not found') {
    return new AppError(404, message);
  }

  static conflict(message) {
    return new AppError(409, message);
  }
}

module.exports = AppError;
