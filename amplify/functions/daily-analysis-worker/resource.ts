import { defineFunction, secret } from '@aws-amplify/backend';

export const dailyAnalysisWorker = defineFunction({
  name: 'daily-analysis-worker',
  entry: './handler.ts',
  runtime: 20,
  resourceGroupName: 'data', // CRITICAL: Grants DynamoDB access via Amplify Data Client
  timeoutSeconds: 300, // 5 minutes per user
  memoryMB: 1024,
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
    ENV: process.env.ENV || 'dev',
    REGION: process.env.AWS_REGION || 'us-east-1',
  },
});