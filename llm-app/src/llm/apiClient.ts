import { grpcClient } from '../grpc/client';

export const apiListCollections = () => grpcClient.listCollections();

export const apiQueryCollection = (input: unknown) => grpcClient.queryCollection(input);

export const apiFindById = (input: unknown) => {
  const { collection, id, populate } = input as { collection: string; id: string; populate?: string[] };
  return grpcClient.findById({ collection, id, populate });
};

export const apiAggregate = (input: unknown) => grpcClient.aggregate(input);
