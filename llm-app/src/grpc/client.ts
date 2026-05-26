import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import logger from '../utils/logger';

const PROTO_PATH = path.join(__dirname, '../../proto/store.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proto = grpc.loadPackageDefinition(packageDef) as any;

const DB_SERVER = process.env.DB_GRPC_URL ?? 'localhost:50051';

let _client: grpc.Client | null = null;

function getClient(): grpc.Client {
  if (!_client) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _client = new proto.store.StoreService(DB_SERVER, grpc.credentials.createInsecure()) as grpc.Client;
    logger.info('gRPC client connected', { server: DB_SERVER });
  }
  return _client;
}

function call<T>(method: string, req: unknown): Promise<T> {
  const reqSummary = JSON.stringify(req).substring(0, 300);
  logger.info('gRPC request', { method, request: reqSummary });

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getClient() as any)[method](req, (err: grpc.ServiceError | null, response: { json: string; error: string }) => {
      if (err) {
        logger.error('gRPC call failed', { method, code: err.code, error: err.message });
        return reject(new Error(`gRPC ${method} failed: ${err.message}`));
      }
      if (response.error) {
        logger.warn('gRPC handler error', { method, error: response.error });
        return reject(new Error(response.error));
      }
      const parsed = JSON.parse(response.json) as T;
      const p = parsed as Record<string, unknown>;
      if ('total' in p) {
        logger.info('gRPC response', { method, total: p.total, returned: Array.isArray(p.data) ? p.data.length : 'N/A' });
      } else {
        logger.info('gRPC response ok', { method });
      }
      resolve(parsed);
    });
  });
}

export const grpcClient = {
  listCollections: () =>
    call<unknown>('ListCollections', {}),

  queryCollection: (input: unknown) =>
    call<unknown>('QueryCollection', { json: JSON.stringify(input) }),

  findById: (input: { collection: string; id: string; populate?: string[] }) =>
    call<unknown>('FindById', { collection: input.collection, id: input.id, populate: input.populate ?? [] }),

  aggregate: (input: unknown) =>
    call<unknown>('Aggregate', { json: JSON.stringify(input) }),
};
