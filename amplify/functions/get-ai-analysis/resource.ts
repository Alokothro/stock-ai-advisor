import { defineFunction } from '@aws-amplify/backend';

export const getAIAnalysis = defineFunction({
  name: 'get-ai-analysis',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 30,
  memoryMB: 512,
  environment: {
    // This will be set via backend.ts
  }
});