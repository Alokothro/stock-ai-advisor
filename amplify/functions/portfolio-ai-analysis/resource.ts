import { defineFunction, secret } from '@aws-amplify/backend';

export const portfolioAIAnalysis = defineFunction({
  name: 'portfolio-ai-analysis',
  runtime: 20,
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});