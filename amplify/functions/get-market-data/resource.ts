import { defineFunction, secret } from '@aws-amplify/backend';

export const getMarketData = defineFunction({
  name: 'get-market-data',
  entry: './handler.ts',
  environment: {
    ALPHA_VANTAGE_API_KEY: secret('ALPHA_VANTAGE_API_KEY'),
    COINGECKO_API_KEY: secret('COINGECKO_API_KEY'),
  },
  timeoutSeconds: 30,
});