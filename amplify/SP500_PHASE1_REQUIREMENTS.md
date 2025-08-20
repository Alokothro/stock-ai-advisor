# 📊 S&P 500 Real-Time Data Pipeline - Phase 1 Requirements

## 🎯 Executive Summary
Implement a minimal viable product (MVP) for fetching and displaying real-time stock data for 5 selected S&P 500 companies using AWS Amplify Gen 2, scheduled Lambda functions, DynamoDB caching, and Next.js frontend.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PHASE 1 ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  EventBridge (30 min) ──▶ Lambda ──▶ Finnhub API                │
│         │                    │                                    │
│         │                    ▼                                    │
│         │              DynamoDB (MarketData)                      │
│         │                    │                                    │
│         │                    ▼                                    │
│         └──────────▶  Next.js Frontend                           │
│                       (Real-time Display)                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 Phase 1 Requirements

### 1. Backend Infrastructure

#### 1.1 Lambda Function Activation
- **File**: `amplify/functions/batch-update-sp500/`
- **Requirements**:
  - ✅ Uncomment function import in `backend.ts` (line 4)
  - ✅ Add function to backend definition (line 26)
  - ✅ Uncomment IAM permissions block (lines 34-46)
  - ✅ Add schema-level authorization for Lambda access
  - ✅ Verify `resourceGroupName: 'data'` is set in resource.ts
  - ✅ Confirm EventBridge schedule configuration (30 minutes)

#### 1.2 Data Model Configuration
- **File**: `amplify/data/resource.ts`
- **Requirements**:
  - ✅ Verify MarketData model supports all required fields
  - ✅ Add Lambda function to schema-level authorization
  - ✅ Ensure public read access via `allow.guest()` or `allow.publicApiKey()`
  - ✅ Configure proper indexes for symbol-based queries

#### 1.3 Stock Selection (MVP)
- **Initial 5 Stocks**:
  1. AAPL (Apple) - Technology
  2. MSFT (Microsoft) - Technology  
  3. AMZN (Amazon) - E-commerce
  4. GOOGL (Alphabet) - Technology
  5. TSLA (Tesla) - Automotive

### 2. Lambda Function Modifications

#### 2.1 Handler Updates
- **File**: `amplify/functions/batch-update-sp500/handler.ts`
- **Requirements**:
  - ✅ Modify to process only 5 selected stocks (not all 503)
  - ✅ Implement proper error handling for API failures
  - ✅ Add CloudWatch logging for monitoring
  - ✅ Implement fallback to mock data if API fails
  - ✅ Add metrics tracking (success/failure counts)

#### 2.2 Resource Configuration
- **File**: `amplify/functions/batch-update-sp500/resource.ts`
- **Current Config** (No changes needed):
  ```typescript
  timeoutSeconds: 300  // Keep 5 minutes
  memoryMB: 512       // Sufficient for 5 stocks
  schedule: 'every 30m' // Production-ready interval
  ```

### 3. Frontend Implementation

#### 3.1 Data Display Component
- **Location**: `app/components/SP500Dashboard.tsx` (new)
- **Requirements**:
  - ✅ Real-time price display with auto-refresh
  - ✅ Price change indicators (up/down arrows)
  - ✅ Percentage change display
  - ✅ Last update timestamp
  - ✅ Loading states and error handling

#### 3.2 API Integration
- **Requirements**:
  - ✅ Use Amplify Data Client for DynamoDB queries
  - ✅ Implement 30-second polling for fresh data
  - ✅ Configure proper auth mode (`apiKey` for public access)
  - ✅ Handle connection errors gracefully

#### 3.3 UI/UX Requirements
- **Visual Elements**:
  - ✅ Stock ticker cards with company logos
  - ✅ Green/red color coding for gains/losses
  - ✅ Sparkline charts (optional for Phase 1)
  - ✅ Mobile-responsive grid layout
  - ✅ Dark mode support

### 4. Deployment Steps

#### 4.1 Backend Deployment
```bash
# 1. Uncomment Lambda function in backend.ts
# 2. Add schema authorization
# 3. Deploy backend
npx ampx pipeline-deploy --branch main --app-id [APP_ID]

# 4. Verify Lambda deployment
aws lambda list-functions --query "Functions[?contains(FunctionName, 'batch-update-sp500')]"

# 5. Verify EventBridge rule
aws events list-rules --name-prefix "*sp500*"
```

#### 4.2 Frontend Deployment
```bash
# 1. Create SP500Dashboard component
# 2. Import into main page
# 3. Test locally
npm run dev

# 4. Deploy to production
git push origin main
```

### 5. Testing Requirements

#### 5.1 Lambda Function Testing
- ✅ Manual invocation test
- ✅ Verify DynamoDB writes
- ✅ Check CloudWatch logs
- ✅ Validate EventBridge trigger

#### 5.2 Frontend Testing
- ✅ Data fetching from DynamoDB
- ✅ Real-time updates
- ✅ Error state handling
- ✅ Mobile responsiveness

### 6. Monitoring & Observability

#### 6.1 CloudWatch Metrics
- ✅ Lambda execution duration
- ✅ API call success rate
- ✅ DynamoDB read/write units
- ✅ Error rates and types

#### 6.2 Alarms
- ✅ Lambda failures > 2 in 5 minutes
- ✅ API rate limit approaching
- ✅ DynamoDB throttling

## 🚀 Implementation Checklist

### Backend Tasks
- [ ] Uncomment Lambda function in `backend.ts`
- [ ] Add schema-level authorization in `data/resource.ts`
- [ ] Modify handler to process only 5 stocks
- [ ] Test Lambda function locally
- [ ] Deploy backend with `npx ampx pipeline-deploy`
- [ ] Verify EventBridge schedule is active
- [ ] Confirm first data sync to DynamoDB

### Frontend Tasks
- [ ] Create `SP500Dashboard` component
- [ ] Implement Amplify Data Client queries
- [ ] Add real-time polling mechanism
- [ ] Style stock ticker cards
- [ ] Integrate into main page
- [ ] Test data display
- [ ] Deploy frontend changes

### Validation Tasks
- [ ] Verify data updates every 30 minutes
- [ ] Check all 5 stocks display correctly
- [ ] Test error scenarios (API down, no data)
- [ ] Validate mobile responsiveness
- [ ] Monitor CloudWatch for errors

## 📊 Success Criteria

### Phase 1 is complete when:
1. ✅ Lambda function runs every 30 minutes successfully
2. ✅ 5 selected stocks update in DynamoDB
3. ✅ Frontend displays real-time prices
4. ✅ No critical errors in CloudWatch logs
5. ✅ Page loads in < 2 seconds
6. ✅ Data freshness indicator shows last update

## 🔄 Phase 2 Preview

### Future Enhancements:
- Expand to all 503 S&P 500 stocks
- Add historical data tracking
- Implement user watchlists
- Add technical indicators
- Create price alerts
- Build portfolio tracking
- Add AI-powered analysis

## 📝 Notes

### API Considerations:
- Finnhub free tier: 60 calls/minute
- 5 stocks = well within limits
- Consider caching strategy for Phase 2

### Performance Targets:
- Lambda execution: < 5 seconds for 5 stocks
- DynamoDB writes: < 100ms per stock
- Frontend query: < 500ms
- Total page load: < 2 seconds

### Cost Estimates (Phase 1):
- Lambda: ~$0.50/month (48 executions/day)
- DynamoDB: ~$0.25/month (minimal storage)
- EventBridge: Free tier
- Total: < $1/month

## 🛠️ Technical Dependencies

### Required Environment Variables:
```bash
FINNHUB_API_KEY=your_api_key_here
AWS_REGION=us-east-1
ENV=production
```

### NPM Packages (already installed):
- aws-amplify
- @aws-amplify/backend
- @aws-amplify/backend-cli
- aws-lambda (types)

### Amplify Configuration:
- Auth Mode: Mixed (userPool + apiKey)
- Default: userPool for authenticated
- Public Access: apiKey for MarketData

---

**Document Version**: 1.0.0  
**Created**: 2025-08-20  
**Author**: Amplify Development Team  
**Status**: Ready for Implementation