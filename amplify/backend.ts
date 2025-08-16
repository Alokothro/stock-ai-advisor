import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { batchUpdateSP500 } from './functions/batch-update-sp500/resource';
import { getAIAnalysis } from './functions/get-ai-analysis/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Stack } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
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
  getAIAnalysis,
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

// Grant AI analysis function permissions
backend.getAIAnalysis.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:PutItem',
      'dynamodb:GetItem',
      'dynamodb:UpdateItem',
      'dynamodb:Query',
      'dynamodb:Scan'
    ],
    resources: ['*']
  })
);

// Add environment variables for AI analysis
// NOTE: In production, use AWS Secrets Manager instead of environment variables
backend.getAIAnalysis.resources.lambda.addEnvironment(
  'ANTHROPIC_API_KEY',
  process.env.ANTHROPIC_API_KEY || '***REMOVED******REMOVED***'
);

// Add table name environment variables
backend.getAIAnalysis.resources.lambda.addEnvironment(
  'MARKET_DATA_TABLE_NAME',
  backend.data.resources.tables['MarketData'].tableName
);

backend.getAIAnalysis.resources.lambda.addEnvironment(
  'ANALYSIS_TABLE_NAME',
  backend.data.resources.tables['Analysis'].tableName
);

// Create HTTP API for AI analysis
const apiStack = Stack.of(backend.getAIAnalysis.resources.lambda);
const httpApi = new HttpApi(apiStack, 'AIAnalysisApi', {
  apiName: 'ai-analysis-api',
  corsPreflight: {
    allowHeaders: ['*'],
    allowMethods: [CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
    allowOrigins: ['*'],
  },
});

// Add route for AI analysis
const aiAnalysisIntegration = new HttpLambdaIntegration(
  'AIAnalysisIntegration',
  backend.getAIAnalysis.resources.lambda
);

httpApi.addRoutes({
  path: '/analyze',
  methods: [CorsHttpMethod.POST],
  integration: aiAnalysisIntegration,
});
