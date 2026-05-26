export const ALLOWED_COLLECTIONS = [
  'roles',
  'users',
  'addresses',
  'categories',
  'tags',
  'products',
  'orders',
  'orderitems',
  'reviews',
  'payments',
] as const;

export const FILTER_OPERATORS = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'startsWith', 'endsWith'] as const;

export const AGGREGATE_OPERATIONS = ['count_by_field', 'sum_field', 'avg_field', 'top_n', 'distribution'] as const;

export const MAX_RESULTS = parseInt(process.env.MAX_QUERY_RESULTS ?? '50', 10);
export const DEFAULT_RESULTS = 20;
