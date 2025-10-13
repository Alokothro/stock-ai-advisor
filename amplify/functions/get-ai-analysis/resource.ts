import { defineFunction } from '@aws-amplify/backend';

export const getAIAnalysis = defineFunction({
  name: 'get-ai-analysis',
  entry: './handler.ts',
  runtime: 20,
  resourceGroupName: 'data', // CRITICAL: Grants DynamoDB access
  timeoutSeconds: 30,
  memoryMB: 512,
  environment: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || ''
  }
});