/**
 * Detects prompt-injection and jailbreak attempts in user input.
 * Returns a rejection reason if the input is unsafe, undefined otherwise.
 *
 * Defense strategy: catch the most common bypass patterns while keeping
 * false-positive rate low for legitimate business questions.
 */

const INJECTION_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Classic instruction overrides
  {
    pattern: /ignore\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|rules?|prompts?|constraints?)/i,
    reason: 'instruction-override',
  },
  {
    pattern: /forget\s+(everything|all|what|your)\s*(you('ve)?|i('ve)?|was|were|have\s+been)?\s*(been\s+)?(told|taught|given|instructed|trained)/i,
    reason: 'forget-instructions',
  },
  {
    pattern: /override\s+(your\s+)?(system|safety|security|previous|all)\s+(prompt|instructions?|rules?|constraints?)/i,
    reason: 'override-instructions',
  },

  // Role-play / persona hijack
  {
    pattern: /you\s+are\s+now\s+(a|an|the)\s+\w/i,
    reason: 'persona-hijack',
  },
  {
    pattern: /act\s+as\s+(if\s+you('re|are|were)|a|an|the)\s+\w/i,
    reason: 'persona-hijack',
  },
  {
    pattern: /pretend\s+(you('re|\s+are|\s+were)|to\s+be)\s+\w/i,
    reason: 'persona-hijack',
  },
  {
    pattern: /\bDAN\b|\bjailbreak\b/i,
    reason: 'known-jailbreak',
  },

  // System prompt extraction
  {
    pattern: /reveal\s+(your|the)\s+(system\s+)?(prompt|instructions?|rules?|context|configuration)/i,
    reason: 'prompt-extraction',
  },
  {
    pattern: /show\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions?|rules?|context|configuration)/i,
    reason: 'prompt-extraction',
  },
  {
    pattern: /what\s+(is|are|were)\s+(your|the)\s+(instructions?|rules?|system\s+prompt|constraints?)/i,
    reason: 'prompt-extraction',
  },
  {
    pattern: /print\s+(your\s+)?(system\s+)?prompt/i,
    reason: 'prompt-extraction',
  },
  {
    pattern: /repeat\s+(everything|all|your\s+instructions?|the\s+above|what\s+you\s+(were|have\s+been)\s+told)/i,
    reason: 'prompt-extraction',
  },

  // Schema / tech extraction
  {
    pattern: /what\s+(collections?|tables?|databases?|schemas?)\s+(do\s+you\s+have|are\s+(there|available)|exist)/i,
    reason: 'schema-extraction',
  },
  {
    pattern: /list\s+(all\s+)?(your\s+)?(collections?|tables?|databases?|fields?|schemas?)/i,
    reason: 'schema-extraction',
  },
  {
    pattern: /show\s+(me\s+)?(all\s+)?(your\s+)?(collections?|tables?|databases?|fields?|schemas?)/i,
    reason: 'schema-extraction',
  },

  // Bypass wording
  {
    pattern: /bypass\s+(your\s+)?(safety|security|restrictions?|filters?|rules?|instructions?)/i,
    reason: 'bypass-attempt',
  },
  {
    pattern: /disable\s+(your\s+)?(safety|security|restrictions?|filters?|rules?)/i,
    reason: 'bypass-attempt',
  },
  {
    pattern: /without\s+(any\s+)?(restrictions?|limitations?|filters?|rules?|constraints?)/i,
    reason: 'bypass-attempt',
  },
  {
    pattern: /\[INST\]|\[\/INST\]|<\|system\|>|<\|user\|>|<\|assistant\|>/i,
    reason: 'template-injection',
  },
];

export interface GuardResult {
  blocked: boolean;
  reason?: string;
}

export function checkInput(input: string): GuardResult {
  const normalized = input.replace(/\s+/g, ' ').trim();

  for (const { pattern, reason } of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason };
    }
  }

  return { blocked: false };
}
