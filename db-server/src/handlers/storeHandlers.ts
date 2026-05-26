import * as grpc from '@grpc/grpc-js';
import { executeQuery, executeFindById, executeAggregate, getCollectionInfo } from '../query/queryEngine';
import logger from '../utils/logger';

type Callback = grpc.sendUnaryData<{ json: string; error: string }>;

interface FindByIdCall {
  request: { collection: string; id: string; populate: string[] };
}
interface JsonCall {
  request: { json: string };
}

async function wrap(fn: () => Promise<unknown>, cb: Callback): Promise<void> {
  try {
    const result = await fn();
    cb(null, { json: JSON.stringify(result), error: '' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn('Handler error', { error: msg });
    cb(null, { json: '', error: msg });
  }
}

export const storeHandlers = {
  ListCollections: (_call: unknown, cb: Callback) => {
    wrap(() => Promise.resolve(getCollectionInfo()), cb);
  },

  QueryCollection: (call: JsonCall, cb: Callback) => {
    wrap(() => executeQuery(JSON.parse(call.request.json)), cb);
  },

  FindById: (call: FindByIdCall, cb: Callback) => {
    wrap(() => executeFindById(call.request), cb);
  },

  Aggregate: (call: JsonCall, cb: Callback) => {
    wrap(() => executeAggregate(JSON.parse(call.request.json)), cb);
  },
};
