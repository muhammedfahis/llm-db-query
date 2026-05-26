import 'dotenv/config';
import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import apiRoutes from './api/routes';
import { rateLimiter, requestLogger, errorHandler, notFound } from './api/middleware';
import { grpcClient } from './grpc/client';
import logger from './utils/logger';

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(rateLimiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }));
app.use(requestLogger);

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`LLM server running on http://localhost:${PORT}`);
  logger.info(`DB gRPC server: ${process.env.DB_GRPC_URL ?? 'localhost:50051'}`);
  logger.info('Endpoints:');
  logger.info('  POST /api/query                       — Natural language LLM query');
  logger.info('  POST /api/collections/:col/find       — Structured find (via gRPC)');
  logger.info('  GET  /api/collections/:col/:id        — Find by ID (via gRPC)');
  logger.info('  POST /api/collections/:col/aggregate  — Aggregation (via gRPC)');
  logger.info('  GET  /api/schema                      — Collection schema (via gRPC)');
  logger.info('  GET  /api/health                      — Health check');

  // Verify db-server is reachable and log collection counts at startup
  grpcClient.listCollections()
    .then(schema => {
      const collections = Object.keys(schema as Record<string, unknown>);
      logger.info('gRPC db-server reachable', { collections });
    })
    .catch(err => {
      logger.error('gRPC db-server NOT reachable — all LLM tool calls will fail', { error: (err as Error).message });
      logger.error('Start the db-server with: cd db-server && npm run dev');
    });
});

const shutdown = (signal: string) => {
  logger.info(`${signal} received — shutting down`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
