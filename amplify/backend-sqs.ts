import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { getAIAnalysis } from './functions/get-ai-analysis/resource';
import { dailyAnalysisOrchestrator } from './functions/daily-analysis-orchestrator/resource';
import { dailyAnalysisWorker } from './functions/daily-analysis-worker/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Duration } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  getAIAnalysis,
  dailyAnalysisOrchestrator,
  dailyAnalysisWorker,
});

// Create SQS Queue for user analysis tasks
const userAnalysisQueue = new Queue(backend.stack, 'UserAnalysisQueue', {
  queueName: 'user-daily-analysis-queue',
  visibilityTimeout: Duration.seconds(360), // 6 minutes (longer than worker timeout)
  retentionPeriod: Duration.days(1),
  deadLetterQueue: {
    queue: new Queue(backend.stack, 'UserAnalysisDLQ', {
      queueName: 'user-daily-analysis-dlq',
      retentionPeriod: Duration.days(7),
    }),
    maxReceiveCount: 3, // Retry 3 times before sending to DLQ
  },
});

// Configure worker Lambda to be triggered by SQS
backend.dailyAnalysisWorker.resources.lambda.addEventSource(
  new SqsEventSource(userAnalysisQueue, {
    batchSize: 1, // Process one user at a time
    maxBatchingWindowInMs: 0, // Process immediately
    reportBatchItemFailures: true, // Enable partial batch failure
  })
);

// Pass queue URL to orchestrator
backend.dailyAnalysisOrchestrator.resources.lambda.addEnvironment(
  'USER_ANALYSIS_QUEUE_URL',
  userAnalysisQueue.queueUrl
);

// Set up EventBridge rule for daily trigger (9 AM ET)
const dailyTriggerRule = new Rule(backend.stack, 'DailyAnalysisRule', {
  ruleName: 'daily-portfolio-analysis',
  schedule: Schedule.cron({
    minute: '0',
    hour: '14', // 9 AM ET (14:00 UTC)
    weekDay: 'MON-FRI', // Only weekdays
  }),
  description: 'Trigger daily portfolio analysis for all opted-in users',
});

dailyTriggerRule.addTarget(
  new LambdaFunction(backend.dailyAnalysisOrchestrator.resources.lambda)
);

// Grant permissions for orchestrator
backend.dailyAnalysisOrchestrator.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['sqs:SendMessage', 'sqs:SendMessageBatch'],
    resources: [userAnalysisQueue.queueArn],
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
      'dynamodb:Scan',
    ],
    resources: ['*'],
  })
);

// Add function URL for AI analysis Lambda
const functionUrl = backend.getAIAnalysis.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [HttpMethod.POST],
    allowedHeaders: ['*'],
  },
});

// Output important resources
backend.addOutput({
  custom: {
    AI_API_ENDPOINT: functionUrl.url,
    QUEUE_URL: userAnalysisQueue.queueUrl,
    QUEUE_NAME: userAnalysisQueue.queueName,
  },
});