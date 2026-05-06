import { query } from '../db/client.js';
import { createServices } from '../lib/services.js';
import { env } from '../lib/config.js';
import { Errors } from '../middleware/error.js';
import type { AiChatDto, AiGapAnalysisDto, AiSubmissionReadinessDto } from '@rim/types';

const DEMO_RATE_LIMIT = 10;
const DEMO_WINDOW_SECONDS = 60;

// In-process rate limit counter for local mode (no Redis)
const localCounter = new Map<string, { count: number; resetsAt: number }>();

let _services: ReturnType<typeof createServices> | null = null;
function getServices() {
  if (!_services) _services = createServices();
  return _services;
}

async function checkDemoRateLimit(tenantId: string): Promise<void> {
  if (!env.isDemo) return;

  const key = `ai:rate:${tenantId}`;
  const now = Math.floor(Date.now() / 1000);

  // Use in-process counter (Redis not wired in this phase)
  const current = localCounter.get(key);
  if (!current || current.resetsAt <= now) {
    localCounter.set(key, { count: 1, resetsAt: now + DEMO_WINDOW_SECONDS });
    return;
  }
  if (current.count >= DEMO_RATE_LIMIT) {
    throw Errors.demoLimit(
      'AI rate limit exceeded. Demo tier allows 10 requests per minute.',
      `${DEMO_RATE_LIMIT} req/min`,
      `${current.count} req/min`,
    );
  }
  current.count++;
}

export interface AiInsightRow {
  id: string;
  tenant_id: string;
  insight_type: string;
  title: string;
  insight_text: string;
  severity: string;
  status: string;
  referenced_entity_type: string | null;
  referenced_entity_id: string | null;
  actioned_by: string | null;
  actioned_at: Date | null;
  ai_model_version: string | null;
  confidence_score: number | null;
  expires_at: Date | null;
  generated_at: Date;
}

export async function listAiInsights(
  tenantId: string,
  q: { cursor?: string; limit?: number; status?: string; entity_type?: string; entity_id?: string },
): Promise<{ data: AiInsightRow[]; total: number; nextCursor: string | null }> {
  const limit = q.limit ?? 25;

  const conditions: string[] = ['tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let idx = 2;

  if (q.status) { conditions.push(`status = $${idx++}`); values.push(q.status); }
  if (q.entity_type) { conditions.push(`referenced_entity_type = $${idx++}`); values.push(q.entity_type); }
  if (q.entity_id) { conditions.push(`referenced_entity_id = $${idx++}`); values.push(q.entity_id); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ai_insights ${where}`,
    values,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const itemsResult = await query<AiInsightRow>(
    `SELECT * FROM ai_insights ${where}
     ORDER BY generated_at DESC
     LIMIT $${idx} OFFSET 0`,
    [...values, limit],
  );

  const nextCursor =
    itemsResult.rows.length === limit
      ? itemsResult.rows[itemsResult.rows.length - 1].id
      : null;

  return { data: itemsResult.rows, total, nextCursor };
}

export async function runGapAnalysis(
  tenantId: string,
  userId: string,
  dto: AiGapAnalysisDto,
): Promise<{ gaps: Array<{ moduleCode: string; moduleTitle: string; severity: string; description: string; suggestedAction: string }>; tokensUsed: number }> {
  await checkDemoRateLimit(tenantId);

  // Fetch dossier modules for context
  const modulesResult = await query(
    `SELECT dm.module_code, dm.title, dm.status, dm.gap_description
     FROM dossier_modules dm
     JOIN dossiers d ON dm.dossier_id = d.id
     JOIN registrations r ON r.product_id = d.product_id
     WHERE r.id = $1 AND r.tenant_id = $2
     LIMIT 50`,
    [dto.registrationId, tenantId],
  );

  const sectionContent = JSON.stringify(modulesResult.rows);
  const { gaps, suggestions } = await getServices().ai.analyzeGaps(dto.registrationId, sectionContent);

  // Map to GapItem format
  const gapItems = gaps.map((g, i) => ({
    moduleCode: `GAP-${i + 1}`,
    moduleTitle: 'Identified Gap',
    severity: 'medium',
    description: g,
    suggestedAction: suggestions[i] ?? 'Review and remediate.',
  }));

  return { gaps: gapItems, tokensUsed: 0 };
}

export async function runSubmissionReadiness(
  tenantId: string,
  _userId: string,
  dto: AiSubmissionReadinessDto,
): Promise<{ score: number; issues: Array<{ area: string; description: string }>; recommendations: string[] }> {
  await checkDemoRateLimit(tenantId);

  // Stub implementation — real logic would query submission documents, modules, etc.
  const submissionResult = await query(
    'SELECT * FROM submissions WHERE id = $1 AND tenant_id = $2',
    [dto.submissionId, tenantId],
  );

  if (!submissionResult.rows[0]) {
    throw Errors.notFound(`Submission ${dto.submissionId} not found.`);
  }

  const completeness = submissionResult.rows[0].completeness_pct ?? 0;

  return {
    score: completeness,
    issues: completeness < 80
      ? [{ area: 'Completeness', description: 'Submission completeness is below 80%.' }]
      : [],
    recommendations:
      completeness < 80
        ? ['Complete all required CTD sections before filing.']
        : ['Submission appears ready for review.'],
  };
}

export async function runAiChat(
  tenantId: string,
  _userId: string,
  dto: AiChatDto,
): Promise<{ reply: string }> {
  await checkDemoRateLimit(tenantId);

  const systemPrompt =
    `You are RegAxis, an AI assistant specializing in regulatory affairs for pharmaceutical products. ` +
    `You help with registration management, submission preparation, dossier review, and regulatory strategy. ` +
    (dto.context ? `Current context: ${dto.context.module}${dto.context.entityId ? ` (ID: ${dto.context.entityId})` : ''}.` : '');

  const { reply } = await getServices().ai.chat({
    systemPrompt,
    messages: [{ role: 'user', content: dto.message }],
  });

  return { reply };
}

export async function* streamAiChat(
  tenantId: string,
  _userId: string,
  dto: AiChatDto,
): AsyncIterable<string> {
  await checkDemoRateLimit(tenantId);

  const systemPrompt =
    `You are RegAxis, an AI assistant specializing in regulatory affairs. ` +
    (dto.context ? `Current context: ${dto.context.module}.` : '');

  yield* getServices().ai.streamChat({
    systemPrompt,
    messages: [{ role: 'user', content: dto.message }],
  });
}
