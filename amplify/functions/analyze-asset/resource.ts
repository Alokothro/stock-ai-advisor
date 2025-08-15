import { defineFunction } from '@aws-amplify/backend';

export const analyzeAsset = defineFunction({
  name: 'analyze-asset',
  entry: './handler.ts',
  timeoutSeconds: 30,
});