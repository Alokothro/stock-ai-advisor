import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
// import { getMarketData } from './functions/get-market-data/resource';
// import { analyzeAsset } from './functions/analyze-asset/resource';
// import { getAIRecommendation } from './functions/get-ai-recommendation/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  auth,
  data,
  // getMarketData,
  // analyzeAsset,
  // getAIRecommendation,
});
