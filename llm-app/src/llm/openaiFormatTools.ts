import { ALLOWED_COLLECTIONS, FILTER_OPERATORS, AGGREGATE_OPERATIONS, MAX_RESULTS } from '../query/schema';

// OpenAI function-calling format — used by both Groq and Ollama providers
export const openaiFormatTools = [
  {
    type: 'function',
    function: {
      name: 'list_collections',
      description:
        'List all available MongoDB collections with their queryable fields. ' +
        'Call this first to understand the data model.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_collection',
      description:
        'Query documents from a MongoDB collection with structured filters. ' +
        'Filters use AND logic. Results are paginated and capped at ' + MAX_RESULTS + '. ' +
        'The response includes a "total" field with the total document count.',
      parameters: {
        type: 'object',
        required: ['collection'],
        properties: {
          collection: {
            type: 'string',
            enum: [...ALLOWED_COLLECTIONS],
            description: 'Target collection name',
          },
          filters: {
            type: 'array',
            description: 'Filter conditions (AND logic)',
            items: {
              type: 'object',
              required: ['field', 'operator', 'value'],
              properties: {
                field:    { type: 'string', description: 'Field name to filter on' },
                operator: {
                  type: 'string',
                  enum: [...FILTER_OPERATORS],
                  description:
                    'Comparison operator. MUST be one of: ' + FILTER_OPERATORS.join(', ') + '. ' +
                    'Never use "like", "regex", "between", "exists", or any other value.',
                },
                value:    {
                  description: 'Filter value — string, number, boolean, null, or array for in/nin operators',
                  anyOf: [
                    { type: 'string' },
                    { type: 'number' },
                    { type: 'boolean' },
                    { type: 'null' },
                    { type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'number' }] } },
                  ],
                },
              },
            },
          },
          sort: {
            type: 'object',
            required: ['field', 'direction'],
            properties: {
              field:     { type: 'string' },
              direction: { type: 'string', enum: ['asc', 'desc'] },
            },
          },
          limit:   { type: 'number', minimum: 1, maximum: MAX_RESULTS },
          page:    { type: 'number', minimum: 1 },
          select:  { type: 'array', items: { type: 'string' }, description: 'Fields to return' },
          populate: { type: 'array', items: { type: 'string' }, description: 'Ref fields to join (e.g. userId, categoryId)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_by_id',
      description: 'Retrieve a single document by its MongoDB ObjectId (_id).',
      parameters: {
        type: 'object',
        required: ['collection', 'id'],
        properties: {
          collection: { type: 'string', enum: [...ALLOWED_COLLECTIONS] },
          id:         { type: 'string', description: '24-character hex MongoDB ObjectId' },
          populate:   { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'aggregate_data',
      description:
        'Run aggregation operations on a collection. ' +
        'count_by_field: group + count | sum_field: group + sum | avg_field: group + average | ' +
        'top_n: top N docs sorted by a field | distribution: value distribution with percentages.',
      parameters: {
        type: 'object',
        required: ['collection', 'operation', 'params'],
        properties: {
          collection: { type: 'string', enum: [...ALLOWED_COLLECTIONS] },
          operation:  { type: 'string', enum: [...AGGREGATE_OPERATIONS] },
          params: {
            type: 'object',
            properties: {
              groupByField:  { type: 'string', description: 'Field to group by (or sort field for top_n)' },
              valueField:    { type: 'string', description: 'Numeric field to aggregate (sum/avg)' },
              n:             { type: 'number', minimum: 1, maximum: MAX_RESULTS },
              sortDirection: { type: 'string', enum: ['asc', 'desc'] },
              filters: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['field', 'operator', 'value'],
                  properties: {
                    field:    { type: 'string' },
                    operator: {
                      type: 'string',
                      enum: [...FILTER_OPERATORS],
                      description: 'Must be one of: ' + FILTER_OPERATORS.join(', '),
                    },
                    value:    { anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'null' }] },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
];
