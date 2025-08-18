import { defineFunction, secret } from '@aws-amplify/backend';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';

export const dailyAnalysisOrchestrator = defineFunction({
  name: 'daily-analysis-orchestrator',
  runtime: 20,
  timeoutSeconds: 60, // Short timeout - just queues messages
  environment: {
    QUEUE_URL: process.env.USER_ANALYSIS_QUEUE_URL || '',
  },
  schedule: 'cron(0 14 * * ? *)', // 9 AM ET (14:00 UTC)
});

// Grant permissions to send messages to SQS
dailyAnalysisOrchestrator.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'sqs:SendMessage',
      'sqs:SendMessageBatch',
      'dynamodb:Query',
      'dynamodb:Scan',
    ],
    resources: ['*'],
  })
);