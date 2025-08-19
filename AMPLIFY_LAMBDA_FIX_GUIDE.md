# Amplify Gen 2 Lambda Functions - Fix Guide & Best Practices

## 🚨 Critical Issue Fixed: AWS SDK vs Amplify Data Client

### The Problem
All Lambda functions were incorrectly using AWS SDK to directly access DynamoDB:
```typescript
// ❌ WRONG - Direct AWS SDK usage
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
```

This caused TypeScript compilation errors because:
1. AWS SDK packages weren't installed (and shouldn't be for Amplify Data operations)
2. It bypasses Amplify's GraphQL schema and authorization
3. It requires manual table name management

### The Solution
Lambda functions MUST use Amplify Data Client for all data operations:
```typescript
// ✅ CORRECT - Amplify Data Client
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { Schema } from '../../data/resource';
```

## 📋 Complete Fix Checklist

### 1. Lambda Resource Configuration
Every Lambda function needs `resourceGroupName: 'data'` in its resource.ts:

```typescript
// amplify/functions/[function-name]/resource.ts
export const myFunction = defineFunction({
  name: 'my-function',
  entry: './handler.ts',
  resourceGroupName: 'data', // 🚨 CRITICAL: Grants DynamoDB access
  timeoutSeconds: 30,
});
```

**Without this**: Lambda cannot access DynamoDB tables (missing IAM permissions)

### 2. Lambda Handler Pattern
Every Lambda handler must initialize Amplify Data Client:

```typescript
// amplify/functions/[function-name]/handler.ts
export const handler = async (event) => {
  // Initialize Amplify Data Client
  const env = process.env as any;
  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
  Amplify.configure(resourceConfig, libraryOptions);
  
  // Create client with IAM auth mode
  const client = generateClient<Schema>({ authMode: 'iam' });
  
  // Now use client.models for all operations
  const { data } = await client.models.MarketData.get({ symbol: 'AAPL' });
  await client.models.MarketData.create({ ... });
  await client.models.MarketData.update({ ... });
};
```

### 3. Schema Authorization (For Scheduled Functions)
For EventBridge scheduled functions, add schema-level authorization:

```typescript
// amplify/data/resource.ts
import { myScheduledFunction } from '../functions/myScheduledFunction/resource';

const schema = a.schema({
  MyModel: a.model({...})
    .authorization((allow) => [
      allow.guest(), // Model-level: Frontend access
    ])
})
.authorization((allow) => [
  allow.resource(myScheduledFunction), // Schema-level: Lambda GraphQL access
]);
```

## 🔧 Fixes Applied to This Project

### Functions Fixed (4 total):
1. **get-market-data**: Fetches and caches market data
2. **get-ai-analysis**: Generates AI analysis using Anthropic
3. **get-ai-recommendation**: Creates personalized recommendations
4. **batch-update-sp500**: Scheduled function to update S&P 500 data

### Changes Made:
- ✅ Removed all `@aws-sdk/client-dynamodb` imports
- ✅ Removed all `@aws-sdk/lib-dynamodb` imports  
- ✅ Added Amplify Data Client initialization to all handlers
- ✅ Added `resourceGroupName: 'data'` to all function resources
- ✅ Updated all DynamoDB operations to use `client.models`
- ✅ Fixed schema `.default()` directive issues on custom types

## 🎯 Common Pitfalls & Solutions

### Pitfall 1: Missing Environment Variables Error
**Error**: "The data environment variables are malformed"
**Cause**: Missing `resourceGroupName: 'data'` or schema authorization
**Fix**: Add both configurations as shown above

### Pitfall 2: TypeScript Import Errors
**Error**: "Cannot find module '@aws-sdk/client-dynamodb'"
**Cause**: Trying to use AWS SDK instead of Amplify Data Client
**Fix**: Use Amplify imports and client.models pattern

### Pitfall 3: Default Values in Custom Types
**Error**: "@default directive may only be added to object definitions annotated with @model"
**Cause**: Using `.default()` on fields within `a.customType()`
**Fix**: Remove `.default()` from custom type fields - only use on model fields

### Pitfall 4: Wrong Handler Type for Scheduled Functions
**Error**: Type mismatch with return value
**Cause**: Using `ScheduledHandler` which expects void return
**Fix**: Use `EventBridgeEvent<string, any>` type instead

## 📚 Key Concepts for AI Assistants

### The Two-Pass Authorization System
Amplify Gen 2 uses a two-pass system for Lambda data access:
1. **Pass 1**: `resourceGroupName: 'data'` → Grants IAM permissions to DynamoDB
2. **Pass 2**: `allow.resource(functionName)` → Injects GraphQL endpoint configuration

**Both are required** for Lambda functions to access data!

### GraphQL-First Architecture
- **Always** use GraphQL operations through Amplify Data Client
- **Never** access DynamoDB directly with AWS SDK
- **Never** manually manage table names or ARNs
- The schema is the single source of truth

### Authentication Modes
- **Frontend**: Uses `userPool` or `apiKey` auth
- **Lambda**: Always uses `iam` auth
- **Scheduled Functions**: Must use `iam` auth with schema authorization

## 🛠️ Debugging Steps

When encountering Lambda function errors:

1. **Check TypeScript compilation**:
   ```bash
   npx ampx sandbox
   # Look for TypeScript errors in the output
   ```

2. **Verify resource configuration**:
   - Check for `resourceGroupName: 'data'` in resource.ts
   - Ensure function is exported from backend.ts

3. **Validate handler pattern**:
   - Confirm Amplify client initialization
   - Check `authMode: 'iam'` is set
   - Verify using `client.models` for data access

4. **Review schema authorization**:
   - For scheduled functions, check schema-level `allow.resource()`
   - Ensure models have appropriate authorization rules

## 🚀 Quick Reference

### Convert AWS SDK to Amplify Data Client

| AWS SDK | Amplify Data Client |
|---------|-------------------|
| `new PutCommand({ TableName, Item })` | `client.models.ModelName.create(item)` |
| `new GetCommand({ TableName, Key })` | `client.models.ModelName.get({ id })` |
| `new UpdateCommand({ TableName, Key, UpdateExpression })` | `client.models.ModelName.update(item)` |
| `new DeleteCommand({ TableName, Key })` | `client.models.ModelName.delete({ id })` |
| `new QueryCommand({ TableName, IndexName })` | `client.models.ModelName.list({ filter })` |

### Essential Imports for Lambda Functions
```typescript
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { Schema } from '../../data/resource';
```

### Lambda Handler Template
```typescript
export const handler = async (event) => {
  try {
    // Initialize Amplify
    const env = process.env as any;
    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
    Amplify.configure(resourceConfig, libraryOptions);
    
    // Create client
    const client = generateClient<Schema>({ authMode: 'iam' });
    
    // Your logic here using client.models
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

## 📖 Resources

- [Amplify Gen 2 Data Documentation](https://docs.amplify.aws/gen2/build-a-backend/data/)
- [Lambda Function Authorization](https://docs.amplify.aws/gen2/build-a-backend/functions/)
- [Scheduled Functions Guide](https://docs.amplify.aws/gen2/build-a-backend/functions/scheduling/)

---

**Last Updated**: December 2024
**Fixed By**: Claude
**Project**: Stock AI Advisor