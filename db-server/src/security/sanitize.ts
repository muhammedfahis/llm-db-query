export function sanitizeString(value: string): string {
  return value
    .replace(/\0/g, '')
    .replace(/\$[\w.]+/g, '')
    .trim()
    .slice(0, 1000);
}

export function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (Object.keys(obj).some(k => k.startsWith('$'))) {
      throw new Error('Operator keys ($) are not allowed in filter values');
    }
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (!k.startsWith('$') && !k.includes('.')) {
        result[k] = sanitizeValue(v);
      }
    }
    return result;
  }
  return value;
}

export function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}
