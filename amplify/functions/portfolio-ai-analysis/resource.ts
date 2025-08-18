import { defineFunction, secret } from '@aws-amplify/backend';

export const portfolioAIAnalysis = defineFunction({
  name: 'portfolio-ai-analysis',
  entry: './handler.ts',
  runtime: 20,
  resourceGroupName: 'data', // CRITICAL: Grants DynamoDB access via Amplify Data Client
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
    ENV: process.env.ENV || 'dev',
    REGION: process.env.AWS_REGION || 'us-east-1',
  },
});