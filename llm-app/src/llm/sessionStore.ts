import { randomUUID } from 'crypto';

export interface ConversationTurn {
  question: string;
  answer: string;
  timestamp: number;
}

interface Session {
  turns: ConversationTurn[];
  lastActivity: number;
}

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes of inactivity

const store = new Map<string, Session>();

// Prune expired sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of store) {
    if (now - session.lastActivity > SESSION_TTL_MS) store.delete(id);
  }
}, 10 * 60 * 1000).unref();

export function createSession(): string {
  const id = randomUUID();
  store.set(id, { turns: [], lastActivity: Date.now() });
  return id;
}

export function getHistory(sessionId: string): ConversationTurn[] {
  return store.get(sessionId)?.turns ?? [];
}

export function addTurn(sessionId: string, question: string, answer: string): void {
  const session = store.get(sessionId);
  if (!session) return;
  session.turns.push({ question, answer, timestamp: Date.now() });
  session.lastActivity = Date.now();
}

export function clearSession(sessionId: string): void {
  store.delete(sessionId);
}

export function ensureSession(sessionId: string): void {
  if (!store.has(sessionId)) {
    store.set(sessionId, { turns: [], lastActivity: Date.now() });
  } else {
    store.get(sessionId)!.lastActivity = Date.now();
  }
}
