import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { EventBridgeEvent } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient({});

const QUEUE_URL = process.env.USER_ANALYSIS_QUEUE_URL;
const USER_PREFERENCES_TABLE = process.env.USER_PREFERENCES_TABLE_NAME;

interface UserPreference {
  userId: string;
  email: string;
  dailyInsightsOptIn: boolean;
  selectedStocks: string[];
  alertPreferences?: {
    priceThreshold?: number;
    volatilityAlert?: boolean;
  };
}

export const handler = async (event: EventBridgeEvent<any, any>) => {
  console.log('Daily Analysis Orchestrator triggered at:', new Date().toISOString());
  
  try {
    // 1. Query all users with daily insights enabled
    const usersToProcess = await getUsersForDailyAnalysis();
    console.log(`Found ${usersToProcess.length} users opted in for daily analysis`);
    
    if (usersToProcess.length === 0) {
      return {
        statusCode: 200,
        message: 'No users to process',
      };
    }
    
    // 2. Batch users and send to SQS (max 10 messages per batch)
    const batches = createBatches(usersToProcess, 10);
    let totalQueued = 0;
    
    for (const batch of batches) {
      const messages = batch.map(user => ({
        Id: user.userId,
        MessageBody: JSON.stringify({
          userId: user.userId,
          email: user.email,
          selectedStocks: user.selectedStocks,
          alertPreferences: user.alertPreferences,
          timestamp: new Date().toISOString(),
        }),
        MessageAttributes: {
          ProcessingType: {
            DataType: 'String',
            StringValue: 'DailyAnalysis',
          },
        },
      }));
      
      const command = new SendMessageBatchCommand({
        QueueUrl: QUEUE_URL,
        Entries: messages,
      });
      
      const result = await sqsClient.send(command);
      totalQueued += result.Successful?.length || 0;
      
      if (result.Failed && result.Failed.length > 0) {
        console.error('Failed to queue some messages:', result.Failed);
      }
    }
    
    console.log(`Successfully queued ${totalQueued} user analysis tasks`);
    
    return {
      statusCode: 200,
      message: `Queued ${totalQueued} user analysis tasks`,
      totalUsers: usersToProcess.length,
    };
    
  } catch (error) {
    console.error('Error in Daily Analysis Orchestrator:', error);
    throw error;
  }
};

async function getUsersForDailyAnalysis(): Promise<UserPreference[]> {
  const users: UserPreference[] = [];
  let lastEvaluatedKey = undefined;
  
  do {
    const command = new ScanCommand({
      TableName: USER_PREFERENCES_TABLE,
      FilterExpression: 'dailyInsightsOptIn = :optIn AND size(selectedStocks) > :zero',
      ExpressionAttributeValues: {
        ':optIn': true,
        ':zero': 0,
      },
      ExclusiveStartKey: lastEvaluatedKey,
    });
    
    const response = await docClient.send(command);
    
    if (response.Items) {
      users.push(...response.Items as UserPreference[]);
    }
    
    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);
  
  return users;
}

function createBatches<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}