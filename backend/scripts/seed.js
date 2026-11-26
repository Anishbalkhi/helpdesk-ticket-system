/**
 *   npm run seed            → admin account only (safe to run repeatedly)
 *   npm run seed -- --demo  → admin + demo user + sample tickets/comments
 *
 * Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD (and DEMO_USER_EMAIL / DEMO_USER_PASSWORD),
 * falling back to the demo values documented in the README.
 */
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/db');
const { MONGODB_URI } = require('../src/config/env');
const { registerEventHandlers } = require('../src/events');
const { seed } = require('../src/seed/seedData');

async function main() {
  await connectDB(MONGODB_URI);
  registerEventHandlers();
  await seed({ demo: process.argv.includes('--demo') });
  await disconnectDB();
}

main().catch(async (err) => {
  console.error(err);
  if (mongoose.connection.readyState) await disconnectDB();
  process.exit(1);
});
