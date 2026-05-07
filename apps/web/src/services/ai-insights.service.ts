import { get, post } from '../lib/api';
import type { AiChatDto, AiGapAnalysisDto, AiSubmissionReadinessDto, AiChatResponse } from '@rim/types';

const BASE = '/api/v1/ai';

interface GapItem {
  moduleCode: string;
  moduleTitle: string;
  severity: string;
  description: string;
  suggestedAction: string;
}

interface GapAnalysisResponse {
  gaps: GapItem[];
  tokensUsed: number;
}

interface SubmissionReadinessResponse {
  score: number;
  issues: { description: string; severity: string }[];
  recommendations: string[];
}

export function runGapAnalysis(data: AiGapAnalysisDto): Promise<GapAnalysisResponse> {
  return post<GapAnalysisResponse>(`${BASE}/gap-analysis`, data);
}

export function runSubmissionReadiness(data: AiSubmissionReadinessDto): Promise<SubmissionReadinessResponse> {
  return post<SubmissionReadinessResponse>(`${BASE}/submission-readiness`, data);
}

export function sendAiChat(data: AiChatDto): Promise<AiChatResponse> {
  return post<AiChatResponse>(`${BASE}/chat`, data);
}

/**
 * Stream chat — returns an EventSource connected to /api/v1/ai/stream-chat.
 * The caller is responsible for closing the EventSource.
 */
export function streamAiChat(
  data: AiChatDto,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Event) => void,
): () => void {
  // Use fetch + ReadableStream for POST-based SSE
  const controller = new AbortController();

  const token = typeof window !== 'undefined' ? localStorage.getItem('rim_access_token') : null;

  fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/ai/stream-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            onDone();
            return;
          }
          try {
            const { token: t } = JSON.parse(payload) as { token: string };
            onToken(t);
          } catch {
            // ignore malformed lines
          }
        }
      }
      onDone();
    })
    .catch((err: Event) => {
      if ((err as unknown as { name: string }).name !== 'AbortError') onError(err);
    });

  return () => controller.abort();
}
