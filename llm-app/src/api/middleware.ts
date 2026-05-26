import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10), // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100', 10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests — please wait before retrying.' },
  handler: (req, res, _next, options) => {
    logger.warn('Rate limit exceeded', { ip: req.ip });
    res.status(429).json(options.message);
  },
});

export const queryRateLimiter = rateLimit({
  windowMs: 60_000, // 1 min
  max: 20,
  message: { error: 'Query rate limit exceeded — max 20 queries per minute.' },
});

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip, userAgent: req.get('User-Agent') });
  next();
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err.name === 'ZodError') {
    logger.warn('Validation error', { error: err.message });
    res.status(400).json({ error: 'Invalid input', details: JSON.parse(err.message) });
    return;
  }

  if (err.name === 'ValidationError') {
    logger.warn('Validation error', { error: err.message });
    res.status(400).json({ error: 'Validation failed', details: err.message });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  const status = (err as { status?: number }).status ?? 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message;

  res.status(status).json({ error: message });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' });
}
