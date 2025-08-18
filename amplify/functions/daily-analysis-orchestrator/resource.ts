import { defineFunction } from '@aws-amplify/backend';

export const dailyAnalysisOrchestrator = defineFunction({
  name: 'daily-analysis-orchestrator',
  entry: './handler.ts',
  runtime: 20,
  resourceGroupName: 'data',
  timeoutSeconds: 60,
  environment: {
    ENV: process.env.ENV || 'dev',
    REGION: process.env.AWS_REGION || 'us-east-1',
  },
});