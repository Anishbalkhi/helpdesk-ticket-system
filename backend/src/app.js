const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const apiRoutes = require('./routes');
const { registerEventHandlers } = require('./events');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { CLIENT_URL, isTest, isProduction } = require('./config/env');

function createApp() {
  registerEventHandlers();

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // correct client IPs for rate limiting behind Render/Railway proxies

  app.use(helmet());
  app.use(cors({ origin: CLIENT_URL }));
  app.use(express.json({ limit: '100kb' }));
  if (!isTest) app.use(morgan(isProduction ? 'combined' : 'dev'));

  app.use('/api', apiRoutes);
  app.use('/api', notFound); // unknown /api/* routes → JSON 404

  // In production the built React app is served by this same server (one deployment, no CORS).
  const clientDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
