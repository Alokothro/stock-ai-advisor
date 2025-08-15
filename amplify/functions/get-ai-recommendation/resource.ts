import { defineFunction, secret } from '@aws-amplify/backend';

export const getAIRecommendation = defineFunction({
  name: 'get-ai-recommendation',
  entry: './handler.ts',
  environment: {
    CLAUDE_API_KEY: secret('CLAUDE_API_KEY'),
  },
  timeoutSeconds: 30,
});