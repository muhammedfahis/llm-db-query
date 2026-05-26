export const ALLOWED_COLLECTIONS = [
  'roles', 'users', 'addresses', 'categories', 'tags',
  'products', 'orders', 'orderitems', 'reviews', 'payments',
] as const;

export type AllowedCollection = typeof ALLOWED_COLLECTIONS[number];

export const COLLECTION_SAFE_FIELDS: Record<AllowedCollection, string[]> = {
  roles:      ['_id', 'name', 'slug', 'description', 'permissions', 'isActive', 'createdAt', 'updatedAt'],
  users:      ['_id', 'roleId', 'firstName', 'lastName', 'email', 'phone', 'isActive', 'lastLogin', 'createdAt', 'updatedAt'],
  addresses:  ['_id', 'userId', 'label', 'street', 'city', 'state', 'country', 'zipCode', 'isDefault', 'createdAt'],
  categories: ['_id', 'parentId', 'name', 'slug', 'description', 'sortOrder', 'isActive', 'createdAt'],
  tags:       ['_id', 'name', 'slug', 'color', 'createdAt'],
  products:   ['_id', 'categoryId', 'tagIds', 'name', 'slug', 'sku', 'price', 'comparePrice', 'stock', 'avgRating', 'reviewCount', 'isActive', 'createdAt'],
  orders:     ['_id', 'userId', 'shippingAddressId', 'status', 'subtotal', 'tax', 'shippingCost', 'total', 'notes', 'trackingNumber', 'createdAt'],
  orderitems: ['_id', 'orderId', 'productId', 'quantity', 'unitPrice', 'totalPrice', 'createdAt'],
  reviews:    ['_id', 'userId', 'productId', 'orderId', 'rating', 'title', 'body', 'isVerifiedPurchase', 'helpfulCount', 'createdAt'],
  payments:   ['_id', 'orderId', 'method', 'status', 'amount', 'currency', 'transactionId', 'processedAt', 'createdAt'],
};

export const ALLOWED_POPULATE: Record<AllowedCollection, string[]> = {
  roles:      [],
  users:      ['roleId'],
  addresses:  ['userId'],
  categories: ['parentId'],
  tags:       [],
  products:   ['categoryId', 'tagIds'],
  orders:     ['userId', 'shippingAddressId'],
  orderitems: ['orderId', 'productId'],
  reviews:    ['userId', 'productId', 'orderId'],
  payments:   ['orderId'],
};

export const FILTER_OPERATORS = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'startsWith', 'endsWith'] as const;
export type FilterOperator = typeof FILTER_OPERATORS[number];

export const MONGO_OPERATOR_MAP: Record<FilterOperator, string> = {
  eq: '$eq', ne: '$ne', gt: '$gt', gte: '$gte', lt: '$lt', lte: '$lte',
  in: '$in', nin: '$nin',
  contains: '$regex', startsWith: '$regex', endsWith: '$regex',
};

export const AGGREGATE_OPERATIONS = ['count_by_field', 'sum_field', 'avg_field', 'top_n', 'distribution'] as const;
export type AggregateOperation = typeof AGGREGATE_OPERATIONS[number];

export const MAX_RESULTS  = parseInt(process.env.MAX_QUERY_RESULTS ?? '50', 10);
export const DEFAULT_RESULTS = 20;
