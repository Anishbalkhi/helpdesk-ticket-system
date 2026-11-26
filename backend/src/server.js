const createApp = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { PORT, MONGODB_URI, SEED_ON_START, SEED_DEMO } = require('./config/env');
const { seed } = require('./seed/seedData');

async function start() {
  await connectDB(MONGODB_URI);
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');

  const app = createApp(); // registers event handlers, which seeding relies on

  if (SEED_ON_START) {
    await seed({ demo: SEED_DEMO });
  }

  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${PORT}`);
  });

  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});
