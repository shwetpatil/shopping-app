import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { errorHandler, requestLogger } from '@shopping-app/common';
import inventoryRoutes from './routes/inventory.routes';

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

const limiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', service: 'inventory-service' });
});

app.use('/api/inventory', inventoryRoutes);
app.use(errorHandler);

export default app;
