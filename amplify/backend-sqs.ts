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
import { Duration, Stack } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  getAIAnalysis,
  dailyAnalysisOrchestrator,
  dailyAnalysisWorker,
});

const { cfnResources } = backend.stack;

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
    maxBatchingWindow: Duration.seconds(0), // Process immediately
    reportBatchItemFailures: true, // Enable partial batch failure
  })
);

// Pass queue URL to orchestrator using backend stack
const orchestratorLambda = backend.dailyAnalysisOrchestrator.resources.lambda;
orchestratorLambda.addEnvironment(
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
  new LambdaFunction(orchestratorLambda)
);

// Grant permissions for orchestrator
orchestratorLambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['sqs:SendMessage', 'sqs:SendMessageBatch', 'dynamodb:Scan', 'dynamodb:Query'],
    resources: ['*'],
  })
);

// Grant permissions for worker
const workerLambda = backend.dailyAnalysisWorker.resources.lambda;
workerLambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:GetItem',
      'dynamodb:Query',
      'dynamodb:PutItem',
      'dynamodb:BatchGetItem',
      'ses:SendEmail',
      'secretsmanager:GetSecretValue',
    ],
    resources: ['*'],
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

// Add portfolio AI analysis to backend if needed
// This is imported but not included in defineBackend, so commenting for now
// backend.portfolioAIAnalysis.resources.lambda.addToRolePolicy(
//   new PolicyStatement({
//     actions: [
//       'dynamodb:GetItem',
//       'dynamodb:Query',
//       'dynamodb:BatchGetItem',
//       'secretsmanager:GetSecretValue',
//     ],
//     resources: ['*'],
//   })
// );

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