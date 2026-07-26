import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import marketsRoutes from './routes/markets.routes';
import listingsRoutes from './routes/listings.routes';
import tradesRoutes from './routes/trades.routes';
import adminRoutes from './routes/admin.routes';
import statusRoutes from './routes/status.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Versioned API
  const v1 = express.Router();
  v1.use(authRoutes);
  v1.use(profileRoutes);
  v1.use(marketsRoutes);
  v1.use(listingsRoutes);
  v1.use(tradesRoutes);
  v1.use(statusRoutes);
  v1.use('/admin', adminRoutes);

  app.use('/api/v1', v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}