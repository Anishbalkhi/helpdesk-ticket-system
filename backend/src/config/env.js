const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = {
  NODE_ENV,
  isProduction,
  isTest: NODE_ENV === 'test',
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/helpdesk',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  // Create the admin (and demo data) on startup — for hosts without a shell. Idempotent.
  SEED_ON_START: process.env.SEED_ON_START === 'true',
  SEED_DEMO: process.env.SEED_DEMO === 'true',
  // Comma-separated list of origins allowed to call the API from a browser.
  CLIENT_URL: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
