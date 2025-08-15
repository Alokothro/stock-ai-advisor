import { defineFunction } from '@aws-amplify/backend';

export const batchUpdateSP500 = defineFunction({
  name: 'batch-update-sp500',
  entry: './handler.ts',
  timeoutSeconds: 300, // 5 minutes for processing 500 stocks
  memoryMB: 512,
  schedule: 'rate(5 minutes)', // Run every 5 minutes
});