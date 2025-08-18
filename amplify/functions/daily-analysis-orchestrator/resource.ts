import { defineFunction, secret } from '@aws-amplify/backend';

export const dailyAnalysisOrchestrator = defineFunction({
  name: 'daily-analysis-orchestrator',
  runtime: 20,
  timeoutSeconds: 60, // Short timeout - just queues messages
  environment: {
    QUEUE_URL: process.env.USER_ANALYSIS_QUEUE_URL || '',
  },
});