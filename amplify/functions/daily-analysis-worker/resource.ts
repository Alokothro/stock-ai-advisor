import { defineFunction, secret } from '@aws-amplify/backend';
import * as iam from 'aws-cdk-lib/aws-iam';

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
  reservedConcurrentExecutions: 50, // Control concurrency to avoid rate limits
});

// Grant permissions for worker
dailyAnalysisWorker.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'dynamodb:GetItem',
      'dynamodb:Query',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'ses:SendEmail',
      'ses:SendTemplatedEmail',
      'secretsmanager:GetSecretValue',
    ],
    resources: ['*'],
  })
);