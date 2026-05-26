import { randomUUID } from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { runQueryAgent } from '../llm/agent';
import { grpcClient } from '../grpc/client';
import { queryRateLimiter } from './middleware';
import { getHistory, addTurn, ensureSession, clearSession } from '../llm/sessionStore';
import { checkInput } from '../security/inputGuard';
import { scrubResponse } from '../security/responseScrubber';
import logger from '../utils/logger';

const router = Router();

const QueryBodySchema = z.object({
  question:  z.string().min(1).max(500).trim(),
  sessionId: z.string().uuid().optional(),
});

// Natural language query via LLM agent
router.post('/query', queryRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, sessionId } = QueryBodySchema.parse(req.body);

    // Block prompt-injection before it reaches the LLM
    const guard = checkInput(question);
    if (guard.blocked) {
      logger.warn('Input blocked by guard', { reason: guard.reason, question });
      return res.status(400).json({ error: "I can only help with business questions about the store." });
    }

    const sid = sessionId ?? randomUUID();
    ensureSession(sid);
    const history = getHistory(sid);

    logger.info('NL query received', { question, sessionId: sid, historyTurns: history.length });
    const result = await runQueryAgent(question, history);

    // Scrub any schema/tech details that leaked into the response
    const safeAnswer = scrubResponse(result.answer);
    addTurn(sid, question, safeAnswer);

    res.json({
      answer:    safeAnswer,
      sessionId: sid,
      metadata: {
        provider:       result.provider,
        model:          result.model,
        toolsUsed:      result.toolsUsed,
        iterationCount: result.iterationCount,
        historyTurns:   history.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Clear a session
router.delete('/session/:id', (req: Request, res: Response) => {
  clearSession(req.params.id);
  res.json({ ok: true });
});

// Direct structured endpoints — all go through gRPC to the db-server
router.post('/collections/:collection/find', queryRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await grpcClient.queryCollection({ collection: req.params.collection, ...req.body });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/collections/:collection/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const populate = req.query.populate ? String(req.query.populate).split(',') : [];
    const result = await grpcClient.findById({ collection: req.params.collection, id: req.params.id, populate });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/collections/:collection/aggregate', queryRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await grpcClient.aggregate({ collection: req.params.collection, ...req.body });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/schema', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await grpcClient.listCollections();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
