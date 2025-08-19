import { defineFunction } from '@aws-amplify/backend';

export const batchUpdateSP500 = defineFunction({
  name: 'batch-update-sp500',
  entry: './handler.ts',
  resourceGroupName: 'data', // CRITICAL: Grants DynamoDB access
  timeoutSeconds: 300, // 5 minutes for processing 500 stocks
  memoryMB: 512,
  schedule: 'every 30m', // Run every 30 minutes (more reasonable for production)
});