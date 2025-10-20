import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth.js';
import { healthCheck } from './db.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/health', async (_req, res, next) => {
  try {
    const ok = await healthCheck();
    res.json({ status: ok ? 'ok' : 'error' });
  } catch (error) {
    next(error);
  }
});

app.use('/auth', authRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
