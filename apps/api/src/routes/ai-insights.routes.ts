import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  AiChatSchema,
  AiGapAnalysisSchema,
  AiSubmissionReadinessSchema,
  PaginationQuerySchema,
} from '@rim/types';
import * as svc from '../services/ai-insights.service.js';

const router = Router();
router.use(requireAuth);

/**
 * GET /ai/insights
 * Paginated list of AI insights for this tenant.
 */
router.get('/insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = PaginationQuerySchema.parse(req.query);
    const result = await svc.listAiInsights(req.user!.tenantId, q);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/**
 * POST /ai/gap-analysis
 * Run gap analysis on a registration's dossier.
 */
router.post('/gap-analysis', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = AiGapAnalysisSchema.parse(req.body);
    const result = await svc.runGapAnalysis(req.user!.tenantId, req.user!.userId, dto);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/**
 * POST /ai/submission-readiness
 * Run submission readiness check.
 */
router.post('/submission-readiness', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = AiSubmissionReadinessSchema.parse(req.body);
    const result = await svc.runSubmissionReadiness(req.user!.tenantId, req.user!.userId, dto);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/**
 * POST /ai/chat
 * Single-turn AI chat (request-response).
 */
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = AiChatSchema.parse(req.body);
    const result = await svc.runAiChat(req.user!.tenantId, req.user!.userId, dto);
    res.status(200).json(result);
  } catch (err) { next(err); }
});

/**
 * POST /ai/stream-chat
 * Streaming AI chat — returns text/event-stream.
 */
router.post('/stream-chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = AiChatSchema.parse(req.body);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const token of svc.streamAiChat(req.user!.tenantId, req.user!.userId, dto)) {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) { next(err); }
});

export { router as aiInsightsRouter };
