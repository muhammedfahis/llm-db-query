import mongoose, { PipelineStage } from 'mongoose';
import { z } from 'zod';
import {
  ALLOWED_COLLECTIONS, COLLECTION_SAFE_FIELDS, ALLOWED_POPULATE,
  FILTER_OPERATORS, MONGO_OPERATOR_MAP, AGGREGATE_OPERATIONS,
  MAX_RESULTS, DEFAULT_RESULTS, AllowedCollection, FilterOperator,
} from './schema';
import { Role, User, Address, Category, Tag, Product, Order, OrderItem, Review, Payment } from '../models';
import { sanitizeString, sanitizeValue, isValidObjectId } from '../security/sanitize';
import logger from '../utils/logger';

const MODEL_MAP: Record<AllowedCollection, mongoose.Model<unknown>> = {
  roles: Role as mongoose.Model<unknown>,
  users: User as mongoose.Model<unknown>,
  addresses: Address as mongoose.Model<unknown>,
  categories: Category as mongoose.Model<unknown>,
  tags: Tag as mongoose.Model<unknown>,
  products: Product as mongoose.Model<unknown>,
  orders: Order as mongoose.Model<unknown>,
  orderitems: OrderItem as mongoose.Model<unknown>,
  reviews: Review as mongoose.Model<unknown>,
  payments: Payment as mongoose.Model<unknown>,
};

const PrimitiveValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const ArrayValue     = z.array(z.union([z.string(), z.number()]));
const FilterSchema   = z.object({
  field:    z.string().min(1).max(60),
  operator: z.enum(FILTER_OPERATORS),
  value:    z.union([PrimitiveValue, ArrayValue]),
});

export const QueryInputSchema = z.object({
  collection: z.enum(ALLOWED_COLLECTIONS),
  filters:    z.array(FilterSchema).max(10).optional().default([]),
  sort:       z.object({ field: z.string(), direction: z.enum(['asc', 'desc']) }).optional(),
  limit:      z.number().int().min(1).max(MAX_RESULTS).optional().default(DEFAULT_RESULTS),
  page:       z.number().int().min(1).optional().default(1),
  select:     z.array(z.string()).max(20).optional(),
  populate:   z.array(z.string()).max(5).optional(),
});

export const FindByIdInputSchema = z.object({
  collection: z.enum(ALLOWED_COLLECTIONS),
  id:         z.string().refine(isValidObjectId, { message: 'Invalid ObjectId' }),
  populate:   z.array(z.string()).max(5).optional(),
});

export const AggregateInputSchema = z.object({
  collection: z.enum(ALLOWED_COLLECTIONS),
  operation:  z.enum(AGGREGATE_OPERATIONS),
  params: z.object({
    groupByField:  z.string().optional(),
    valueField:    z.string().optional(),
    n:             z.number().int().min(1).max(MAX_RESULTS).optional().default(10),
    sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
    filters:       z.array(FilterSchema).max(10).optional().default([]),
  }),
});

function resolveProjection(collection: AllowedCollection, requested?: string[]): Record<string, 0 | 1> {
  const allowed = new Set(COLLECTION_SAFE_FIELDS[collection]);
  const fields  = requested ? requested.filter(f => allowed.has(f)) : [...allowed];
  const proj: Record<string, 0 | 1> = {};
  fields.forEach(f => { proj[f] = 1; });
  return proj;
}

function buildMongoFilter(collection: AllowedCollection, filters: z.infer<typeof QueryInputSchema>['filters']): Record<string, unknown> {
  if (!filters || filters.length === 0) return {};
  const allowedFields = new Set(COLLECTION_SAFE_FIELDS[collection]);
  const query: Record<string, unknown> = {};
  for (const filter of filters) {
    const { field, operator, value } = filter;
    if (!allowedFields.has(field)) throw new Error(`Field '${field}' is not allowed for collection '${collection}'`);
    const safeValue = typeof value === 'string' ? sanitizeString(value) : sanitizeValue(value);
    const mongoOp   = MONGO_OPERATOR_MAP[operator as FilterOperator];
    if (operator === 'contains')    query[field] = { [mongoOp]: new RegExp(escapeRegex(safeValue as string), 'i') };
    else if (operator === 'startsWith') query[field] = { [mongoOp]: new RegExp('^' + escapeRegex(safeValue as string), 'i') };
    else if (operator === 'endsWith')   query[field] = { [mongoOp]: new RegExp(escapeRegex(safeValue as string) + '$', 'i') };
    else query[field] = { [mongoOp]: safeValue };
  }
  return query;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolvePopulate(collection: AllowedCollection, requested?: string[]): string[] {
  if (!requested || requested.length === 0) return [];
  const allowed = new Set(ALLOWED_POPULATE[collection]);
  return requested.filter(f => allowed.has(f));
}

export async function executeQuery(rawInput: unknown): Promise<unknown> {
  const input = QueryInputSchema.parse(rawInput);
  const { collection, filters, sort, limit, page, select, populate } = input;
  const model       = MODEL_MAP[collection];
  const mongoFilter = buildMongoFilter(collection, filters);
  const projection  = resolveProjection(collection, select);
  const safePopulate = resolvePopulate(collection, populate);
  const skip = (page - 1) * limit;
  logger.info('executeQuery', { collection, limit, page });
  let query = model.find(mongoFilter, projection).skip(skip).limit(limit);
  if (sort) {
    const allowedFields = new Set(COLLECTION_SAFE_FIELDS[collection]);
    if (!allowedFields.has(sort.field)) throw new Error(`Sort field '${sort.field}' not allowed`);
    query = query.sort({ [sort.field]: sort.direction === 'asc' ? 1 : -1 });
  }
  for (const path of safePopulate) {
    query = query.populate(path, '-passwordHash -__v -gatewayResponse') as typeof query;
  }
  const [docs, total] = await Promise.all([query.lean().exec(), model.countDocuments(mongoFilter)]);
  return { data: docs, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function executeFindById(rawInput: unknown): Promise<unknown> {
  const input = FindByIdInputSchema.parse(rawInput);
  const { collection, id, populate } = input;
  const model        = MODEL_MAP[collection];
  const projection   = resolveProjection(collection);
  const safePopulate = resolvePopulate(collection, populate);
  logger.info('executeFindById', { collection, id });
  let query = model.findById(id, projection);
  for (const path of safePopulate) {
    query = query.populate(path, '-passwordHash -__v -gatewayResponse') as typeof query;
  }
  const doc = await query.lean().exec();
  if (!doc) return { error: `Document ${id} not found in '${collection}'` };
  return doc;
}

export async function executeAggregate(rawInput: unknown): Promise<unknown> {
  const input = AggregateInputSchema.parse(rawInput);
  const { collection, operation, params } = input;
  const { groupByField, valueField, n, sortDirection, filters } = params;
  const model         = MODEL_MAP[collection];
  const allowedFields = new Set(COLLECTION_SAFE_FIELDS[collection]);
  if (groupByField && !allowedFields.has(groupByField)) throw new Error(`Field '${groupByField}' is not allowed`);
  if (valueField   && !allowedFields.has(valueField))   throw new Error(`Field '${valueField}' is not allowed`);
  const matchStage = filters && filters.length > 0 ? { $match: buildMongoFilter(collection, filters) } : null;
  const sortDir    = sortDirection === 'asc' ? 1 : -1;
  const limitVal   = n ?? 10;
  logger.info('executeAggregate', { collection, operation });
  let pipeline: PipelineStage[] = [];
  if (matchStage) pipeline.push(matchStage);
  switch (operation) {
    case 'count_by_field':
      if (!groupByField) throw new Error('groupByField required');
      pipeline.push(
        { $group: { _id: `$${groupByField}`, count: { $sum: 1 } } },
        { $sort: { count: sortDir } }, { $limit: limitVal },
        { $project: { _id: 0, value: '$_id', count: 1 } }
      ); break;
    case 'sum_field':
      if (!groupByField || !valueField) throw new Error('groupByField and valueField required');
      pipeline.push(
        { $group: { _id: `$${groupByField}`, total: { $sum: `$${valueField}` } } },
        { $sort: { total: sortDir } }, { $limit: limitVal },
        { $project: { _id: 0, value: '$_id', total: 1 } }
      ); break;
    case 'avg_field':
      if (!groupByField || !valueField) throw new Error('groupByField and valueField required');
      pipeline.push(
        { $group: { _id: `$${groupByField}`, average: { $avg: `$${valueField}` }, count: { $sum: 1 } } },
        { $sort: { average: sortDir } }, { $limit: limitVal },
        { $project: { _id: 0, value: '$_id', average: { $round: ['$average', 2] }, count: 1 } }
      ); break;
    case 'top_n':
      if (!groupByField) throw new Error('groupByField required for top_n');
      pipeline.push(
        { $sort: { [groupByField]: sortDir } }, { $limit: limitVal },
        { $project: resolveProjection(collection) }
      ); break;
    case 'distribution':
      if (!groupByField) throw new Error('groupByField required for distribution');
      pipeline.push(
        { $group: { _id: `$${groupByField}`, count: { $sum: 1 } } },
        { $sort: { count: sortDir } },
        { $group: { _id: null, total: { $sum: '$count' }, buckets: { $push: { value: '$_id', count: '$count' } } } },
        { $project: { _id: 0, buckets: { $map: { input: '$buckets', as: 'b', in: { value: '$$b.value', count: '$$b.count', pct: { $round: [{ $multiply: [{ $divide: ['$$b.count', '$total'] }, 100] }, 1] } } } } } }
      ); break;
  }
  return model.aggregate(pipeline).exec();
}

export function getCollectionInfo(): Record<string, unknown> {
  const info: Record<string, unknown> = {};
  for (const col of ALLOWED_COLLECTIONS) {
    info[col] = { fields: COLLECTION_SAFE_FIELDS[col], populatableRefs: ALLOWED_POPULATE[col] };
  }
  return info;
}
