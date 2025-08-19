import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // User portfolio and watchlist
  Portfolio: a
    .model({
      userId: a.id().required(),
      symbol: a.string().required(),
      assetType: a.enum(['STOCK', 'CRYPTO']),
      quantity: a.float(),
      purchasePrice: a.float(),
      purchaseDate: a.datetime(),
      currentPrice: a.float(),
      profitLoss: a.float(),
      profitLossPercentage: a.float(),
    })
    .identifier(['userId', 'symbol'])
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),

  // Watchlist for tracking assets
  Watchlist: a
    .model({
      userId: a.id().required(),
      symbol: a.string().required(),
      assetType: a.enum(['STOCK', 'CRYPTO']),
      name: a.string(),
      currentPrice: a.float(),
      priceChange24h: a.float(),
      percentChange24h: a.float(),
      alertPrice: a.float(),
      notes: a.string(),
    })
    .identifier(['userId', 'symbol'])
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),

  // AI Analysis results
  Analysis: a
    .model({
      symbol: a.string().required(),
      assetType: a.enum(['STOCK', 'CRYPTO']),
      timestamp: a.datetime().required(),
      recommendation: a.enum(['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL']),
      confidenceScore: a.float(),
      technicalScore: a.float(),
      fundamentalScore: a.float(),
      sentimentScore: a.float(),
      priceTarget: a.float(),
      stopLoss: a.float(),
      reasoning: a.string(),
      indicators: a.json(),
      riskLevel: a.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
    })
    .identifier(['symbol', 'timestamp'])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.guest().to(['read']),
    ]),

  // Market data cache
  MarketData: a
    .model({
      symbol: a.string().required(),
      assetType: a.enum(['STOCK', 'CRYPTO']),
      name: a.string(),
      currentPrice: a.float(),
      openPrice: a.float(),
      highPrice: a.float(),
      lowPrice: a.float(),
      closePrice: a.float(),
      volume: a.float(),
      marketCap: a.float(),
      priceChange24h: a.float(),
      percentChange24h: a.float(),
      week52High: a.float(),
      week52Low: a.float(),
      lastUpdated: a.datetime(),
    })
    .identifier(['symbol'])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.guest().to(['read']),
    ]),

  // User alerts and notifications
  Alert: a
    .model({
      userId: a.id().required(),
      symbol: a.string().required(),
      alertType: a.enum(['PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_CHANGE', 'AI_SIGNAL']),
      threshold: a.float(),
      isActive: a.boolean(),
      triggeredAt: a.datetime(),
      message: a.string(),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),

  // User stock preferences for multi-stock portfolio
  UserStockPreferences: a
    .model({
      userId: a.id().required(),
      email: a.email().required(),
      selectedStocks: a.string().array(), // Array of S&P 500 symbols
      dailyInsightsOptIn: a.boolean(),
      alertPreferences: a.customType({
        priceThreshold: a.float(),
        volatilityAlert: a.boolean(),
        earningsAlert: a.boolean(),
      }),
      notificationSettings: a.customType({
        emailEnabled: a.boolean(),
        smsEnabled: a.boolean(),
        pushEnabled: a.boolean(),
        frequency: a.enum(['DAILY', 'WEEKLY', 'REALTIME']),
      }),
      portfolioMetrics: a.customType({
        totalValue: a.float(),
        dailyChange: a.float(),
        weeklyChange: a.float(),
        monthlyChange: a.float(),
      }),
      lastAnalysisDate: a.datetime(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
    ]),

  // Portfolio analysis history
  AnalysisHistory: a
    .model({
      userId: a.id().required(),
      timestamp: a.datetime().required(),
      stocksAnalyzed: a.integer(),
      topGainer: a.string(),
      topLoser: a.string(),
      analysis: a.string(),
      emailSent: a.boolean(),
    })
    .identifier(['userId', 'timestamp'])
    .authorization((allow) => [
      allow.owner().to(['read']),
    ]),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
