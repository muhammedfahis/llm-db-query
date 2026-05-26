/**
 * Post-processes LLM responses to remove any schema/tech details that
 * leaked through the system prompt despite the security rules.
 * This is defense-in-depth — the system prompt is the primary control.
 */

// PII patterns — scrubbed unconditionally before the answer is sent or stored
const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Phone numbers: (NNN) NNN-NNNN, NNN-NNN-NNNN, NNN.NNN.NNNN, 1-NNN-…, with optional x<ext>
  // Uses (?<!\d)/(?!\d) instead of \b so parenthesised formats like (819) 257-7412 are caught too
  {
    pattern: /(?<!\d)(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]\d{3}[-.\s]\d{4}(?:\s*x\d+)?(?!\d)/g,
    replacement: '[phone redacted]',
  },
  // Email addresses
  {
    pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    replacement: '[email redacted]',
  },
];

// Technical terms → business-friendly replacements
const REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  // Collection names (word-boundary match so "orders" in normal text is fine)
  { pattern: /\bcollection[s]?\s+"?orderitems"?/gi,   replacement: 'order items'   },
  { pattern: /\bcollection[s]?\s+"?orders"?/gi,       replacement: 'orders'        },
  { pattern: /\bcollection[s]?\s+"?users"?/gi,        replacement: 'customers'     },
  { pattern: /\bcollection[s]?\s+"?products"?/gi,     replacement: 'products'      },
  { pattern: /\bcollection[s]?\s+"?payments"?/gi,     replacement: 'payments'      },
  { pattern: /\bcollection[s]?\s+"?reviews"?/gi,      replacement: 'reviews'       },
  { pattern: /\bcollection[s]?\s+"?categories"?/gi,   replacement: 'categories'    },
  { pattern: /\bcollection[s]?\s+"?addresses"?/gi,    replacement: 'addresses'     },
  { pattern: /\bcollection[s]?\s+"?tags"?/gi,         replacement: 'tags'          },
  { pattern: /\bcollection[s]?\s+"?roles"?/gi,        replacement: 'roles'         },

  // "in the orderitems/users/… collection"
  { pattern: /\bin\s+the\s+"?orderitems"?\s+collection/gi,  replacement: 'in order items'  },
  { pattern: /\bin\s+the\s+"?users"?\s+collection/gi,       replacement: 'in customers'    },

  // Raw field paths that look like schema internals
  { pattern: /\bpasswordHash\b/g,   replacement: '[hidden]' },
  { pattern: /\b__v\b/g,            replacement: ''         },
  { pattern: /\bgatewayResponse\b/g, replacement: '[hidden]' },

  // Tech stack mentions
  { pattern: /\bMongoDB\b/gi,  replacement: 'the database' },
  { pattern: /\bgRPC\b/gi,     replacement: ''              },
  { pattern: /\bMongoose\b/gi, replacement: ''              },

  // "Available collections:" inventory blocks — redact the whole block
  {
    pattern: /available\s+collections?\s*:[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi,
    replacement: '',
  },
  // "collection: roles, users, …" list lines
  {
    pattern: /collections?\s*:\s*(roles|users|addresses|categories|tags|products|orders|orderitems|reviews|payments)[,\s\w]*/gi,
    replacement: '',
  },
];

export function scrubResponse(text: string): string {
  let result = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  for (const { pattern, replacement } of REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  // Collapse any double-blank lines left by deletions
  return result.replace(/\n{3,}/g, '\n\n').trim();
}
