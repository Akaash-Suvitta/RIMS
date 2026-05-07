import { useMutation } from '@tanstack/react-query';
import type { AiChatDto, AiGapAnalysisDto, AiSubmissionReadinessDto } from '@rim/types';
import { runGapAnalysis, runSubmissionReadiness, sendAiChat } from '../services/ai-insights.service';

export function useGapAnalysis() {
  return useMutation({
    mutationFn: (data: AiGapAnalysisDto) => runGapAnalysis(data),
  });
}

export function useSubmissionReadiness() {
  return useMutation({
    mutationFn: (data: AiSubmissionReadinessDto) => runSubmissionReadiness(data),
  });
}

export function useAiChat() {
  return useMutation({
    mutationFn: (data: AiChatDto) => sendAiChat(data),
  });
}
