const User = require('../models/User');
const AppError = require('../utils/AppError');
const { signToken } = require('../middleware/auth');
const { serializeUser } = require('../utils/serializers');
const { ROLES } = require('../constants');

async function register(req, res) {
  const { name, email, password } = req.body;

  if (await User.exists({ email })) {
    throw AppError.conflict('An account with this email already exists');
  }

  // Role is fixed to "user": admins are only created by the seed script.
  const user = await User.create({ name, email, password, role: ROLES.USER });

  res.status(201).json({
    success: true,
    data: { token: signToken(user), user: serializeUser(user) },
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  // Same message for "no such email" and "wrong password" so emails can't be enumerated.
  if (!user || !(await user.comparePassword(password))) {
    throw AppError.unauthorized('Invalid email or password');
  }

  res.json({
    success: true,
    data: { token: signToken(user), user: serializeUser(user) },
  });
}

async function me(req, res) {
  res.json({ success: true, data: { user: serializeUser(req.user) } });
}

module.exports = { register, login, me };
