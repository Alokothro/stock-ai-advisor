import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { batchUpdateSP500 } from './functions/batch-update-sp500/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
// import { getMarketData } from './functions/get-market-data/resource';
// import { analyzeAsset } from './functions/analyze-asset/resource';
// import { getAIRecommendation } from './functions/get-ai-recommendation/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  batchUpdateSP500,
  // getMarketData,
  // analyzeAsset,
  // getAIRecommendation,
});

// Grant the batch update function access to the MarketData table
backend.batchUpdateSP500.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:PutItem',
      'dynamodb:GetItem',
      'dynamodb:UpdateItem',
      'dynamodb:BatchWriteItem',
      'dynamodb:Query',
      'dynamodb:Scan'
    ],
    resources: ['*']
  })
);
