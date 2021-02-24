import * as connect_datadog from 'connect-datadog';
import ddTracer from 'dd-trace';

import * as dotenv from 'dotenv';
import * as express from 'express';
import { connect } from '../db/connection';
import { debugCrons } from '../debuggers';

import { initMemoryStorage } from '../inmemoryStorage';
import { initBroker } from '../messageBroker';
import './activityLogs';
import './conversations';
import './deals';
import './engages';
import './integrations';
import './notificatons';
import './robot';

// load environment variables
dotenv.config();

ddTracer.init({
  hostname: process.env.DD_HOST,
  logInjection: true
});

const app = express();

const datadogMiddleware = connect_datadog({
  response_code: true,
  tags: ['crons']
});

app.use(datadogMiddleware);

// for health check
app.get('/health', async (_req, res) => {
  res.end('ok');
});

const { PORT_CRONS = 3600 } = process.env;

app.listen(PORT_CRONS, () => {
  // connect to mongo database
  connect().then(async () => {
    initMemoryStorage();

    initBroker(app).catch(e => {
      debugCrons(`Error ocurred during broker init ${e.message}`);
    });
  });

  debugCrons(`Cron Server is now running on ${PORT_CRONS}`);
});
