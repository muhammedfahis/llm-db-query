import Anthropic from '@anthropic-ai/sdk';
import { ALLOWED_COLLECTIONS, FILTER_OPERATORS, AGGREGATE_OPERATIONS, MAX_RESULTS } from '../query/schema';

// Tool definitions passed to Claude on every request.
// Input schemas are intentionally restrictive — they are the first line
// of defense before Zod validation in queryEngine.ts.
export const mongoTools: Anthropic.Messages.Tool[] = [
  {
    name: 'list_collections',
    description:
      'List all available MongoDB collections along with their queryable fields and ref paths. ' +
      'Call this first to understand the data model before composing other queries.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'query_collection',
    description:
      'Query documents from a collection with safe structured filters. ' +
      'Filters use AND logic. All string values are automatically sanitized. ' +
      'Results are paginated and capped at ' + MAX_RESULTS + ' per call.',
    input_schema: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          enum: [...ALLOWED_COLLECTIONS],
          description: 'Target collection name',
        },
        filters: {
          type: 'array',
          description: 'Filter conditions joined with AND',
          items: {
            type: 'object',
            properties: {
              field:    { type: 'string', description: 'Document field to filter on' },
              operator: { type: 'string', enum: [...FILTER_OPERATORS], description: 'Comparison operator' },
              value: {
                description: 'Scalar (string/number/boolean/null) or array for in/nin operators',
              },
            },
            required: ['field', 'operator', 'value'],
          },
          maxItems: 10,
        },
        sort: {
          type: 'object',
          properties: {
            field:     { type: 'string' },
            direction: { type: 'string', enum: ['asc', 'desc'] },
          },
          required: ['field', 'direction'],
        },
        limit: {
          type: 'number',
          minimum: 1,
          maximum: MAX_RESULTS,
          description: `Max documents to return (default ${MAX_RESULTS})`,
        },
        page: {
          type: 'number',
          minimum: 1,
          description: 'Page number for pagination (default 1)',
        },
        select: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific fields to return. Omit to return all safe fields.',
          maxItems: 20,
        },
        populate: {
          type: 'array',
          items: { type: 'string' },
          description: 'Reference field paths to join (e.g. "userId", "categoryId")',
          maxItems: 5,
        },
      },
      required: ['collection'],
    },
  },
  {
    name: 'get_by_id',
    description: 'Retrieve a single document by its MongoDB ObjectId (_id). Use this for detail lookups.',
    input_schema: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          enum: [...ALLOWED_COLLECTIONS],
        },
        id: {
          type: 'string',
          description: '24-character hexadecimal MongoDB ObjectId',
        },
        populate: {
          type: 'array',
          items: { type: 'string' },
          description: 'Reference fields to join',
          maxItems: 5,
        },
      },
      required: ['collection', 'id'],
    },
  },
  {
    name: 'aggregate_data',
    description:
      'Run aggregation operations: count_by_field, sum_field, avg_field, top_n, or distribution. ' +
      'Use this for analytics, rankings, and statistical summaries.',
    input_schema: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          enum: [...ALLOWED_COLLECTIONS],
        },
        operation: {
          type: 'string',
          enum: [...AGGREGATE_OPERATIONS],
          description:
            'count_by_field: group + count | sum_field: group + sum | avg_field: group + average | ' +
            'top_n: top N docs sorted by field | distribution: value distribution with percentages',
        },
        params: {
          type: 'object',
          properties: {
            groupByField:  { type: 'string', description: 'Field to group by (or sort field for top_n)' },
            valueField:    { type: 'string', description: 'Numeric field to aggregate (sum/avg)' },
            n:             { type: 'number', minimum: 1, maximum: MAX_RESULTS, description: 'Result count limit' },
            sortDirection: { type: 'string', enum: ['asc', 'desc'] },
            filters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field:    { type: 'string' },
                  operator: { type: 'string', enum: [...FILTER_OPERATORS] },
                  value:    {},
                },
                required: ['field', 'operator', 'value'],
              },
              maxItems: 10,
            },
          },
        },
      },
      required: ['collection', 'operation', 'params'],
    },
  },
];
