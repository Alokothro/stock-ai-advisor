import { defineFunction, secret } from '@aws-amplify/backend';

export const dailyAnalysisWorker = defineFunction({
  name: 'daily-analysis-worker',
  runtime: 20,
  timeoutSeconds: 300, // 5 minutes per user
  memoryMB: 1024,
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
    MARKET_DATA_TABLE: process.env.MARKET_DATA_TABLE_NAME || '',
    ANALYSIS_HISTORY_TABLE: process.env.ANALYSIS_HISTORY_TABLE_NAME || '',
  },
});