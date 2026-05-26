import 'dotenv/config';
import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { connectDB, disconnectDB } from './db/connection';
import { storeHandlers } from './handlers/storeHandlers';
import logger from './utils/logger';

const PROTO_PATH = path.join(__dirname, '../proto/store.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proto = grpc.loadPackageDefinition(packageDef) as any;

async function main(): Promise<void> {
  await connectDB();

  const server = new grpc.Server();
  server.addService(proto.store.StoreService.service, storeHandlers);

  const port = process.env.GRPC_PORT ?? '50051';
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        logger.error('Failed to bind gRPC server', { error: err.message });
        process.exit(1);
      }
      logger.info(`gRPC db-server listening on port ${boundPort}`);
    }
  );

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    server.tryShutdown(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch(err => {
  logger.error('Fatal startup error', { error: err.message });
  process.exit(1);
});
