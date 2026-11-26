const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verifies the Bearer token and loads the user from the database.
 * Loading the user (instead of trusting the token's role claim) means a deleted
 * user or a changed role takes effect immediately.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw AppError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw AppError.unauthorized(
      err.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid token'
    );
  }

  const user = await User.findById(payload.sub);
  if (!user) throw AppError.unauthorized('User no longer exists');

  req.user = user;
  next();
});

// Usage: router.get('/stats', authenticate, authorize('admin'), handler)
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    return next();
  };

module.exports = { signToken, authenticate, authorize };
