import { a } from '@aws-amplify/backend';

export const UserPreferences = a.model({
  userId: a.id().required(),
  email: a.email().required(),
  selectedStocks: a.string().array(), // Array of S&P 500 symbols
  dailyInsightsOptIn: a.boolean().default(false),
  alertPreferences: a.customType({
    priceThreshold: a.float(),
    volatilityAlert: a.boolean(),
    earningsAlert: a.boolean(),
  }),
  notificationSettings: a.customType({
    emailEnabled: a.boolean().default(true),
    smsEnabled: a.boolean().default(false),
    pushEnabled: a.boolean().default(false),
    frequency: a.enum(['DAILY', 'WEEKLY', 'REALTIME']),
  }),
  portfolioMetrics: a.customType({
    totalValue: a.float(),
    dailyChange: a.float(),
    weeklyChange: a.float(),
    monthlyChange: a.float(),
  }),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
})
  .authorization(allow => [
    allow.owner(),
    allow.authenticated().to(['read']),
  ]);