import { EventBridgeEvent } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { Schema } from '../../data/resource';

export const handler = async (event: EventBridgeEvent<string, any>) => {
  console.log('Daily Analysis Orchestrator triggered at:', new Date().toISOString());
  
  try {
    // Initialize Amplify Data client with IAM authentication
    const env = process.env as any;
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
    Amplify.configure(resourceConfig, libraryOptions);
    
    const client = generateClient<Schema>({ authMode: 'iam' });
    
    // Query all users with daily insights enabled using Amplify Data Client
    const { data: userPreferences } = await client.models.UserStockPreferences.list({
      filter: {
        dailyInsightsOptIn: { eq: true }
      }
    });
    
    const usersToProcess = userPreferences.filter(
      (user) => user.selectedStocks && user.selectedStocks.length > 0
    );
    
    console.log(`Found ${usersToProcess.length} users opted in for daily analysis`);
    
    if (usersToProcess.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No users to process',
        }),
      };
    }
    
    // Process each user - for now, we'll create analysis history records
    const processedUsers = [];
    const currentTimestamp = new Date().toISOString();
    
    for (const user of usersToProcess) {
      // Create analysis history record for tracking
      const analysisRecord = await client.models.AnalysisHistory.create({
        userId: user.userId,
        timestamp: currentTimestamp,
        stocksAnalyzed: user.selectedStocks?.length || 0,
        analysis: 'Scheduled for processing',
        emailSent: false,
      });
      
      if (analysisRecord.data) {
        processedUsers.push(user.userId);
      }
    }
    
    console.log(`Successfully created ${processedUsers.length} analysis tasks`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Created ${processedUsers.length} analysis tasks`,
        totalUsers: usersToProcess.length,
        taskIds: processedUsers,
      }),
    };
    
  } catch (error: any) {
    console.error('Error in Daily Analysis Orchestrator:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process daily analysis',
        details: error.message,
      }),
    };
  }
};