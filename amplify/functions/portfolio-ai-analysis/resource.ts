import { defineFunction, secret } from '@aws-amplify/backend';
import * as iam from 'aws-cdk-lib/aws-iam';

export const portfolioAIAnalysis = defineFunction({
  name: 'portfolio-ai-analysis',
  runtime: 20,
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    OPENAI_API_KEY: secret('OPENAI_API_KEY'),
  },
});

// Grant permissions for AI analysis
portfolioAIAnalysis.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'dynamodb:GetItem',
      'dynamodb:Query',
      'dynamodb:BatchGetItem',
      'secretsmanager:GetSecretValue',
    ],
    resources: ['*'],
  })
);