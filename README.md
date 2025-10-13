# Stock AI Advisor 📈🤖

A full-stack AI-powered stock market analysis platform built with Next.js, AWS Amplify Gen 2, and Anthropic Claude AI. Features real-time S&P 500 data, intelligent stock recommendations, and automated portfolio insights with a serverless architecture.

🚀 **Live Demo**: [Coming Soon - Deploy to AWS Amplify]

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![AWS Amplify](https://img.shields.io/badge/AWS-Amplify_Gen_2-FF9900)](https://aws.amazon.com/amplify/)
[![Anthropic Claude](https://img.shields.io/badge/AI-Claude_Haiku-8A2BE2)](https://www.anthropic.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Installation & Setup](#-installation--setup)
- [API Documentation](#-api-documentation)
- [Database Design](#-database-design)
- [Deployment](#-deployment)
- [Challenges & Solutions](#-challenges--solutions)
- [Future Enhancements](#-future-enhancements)

---

## 🎯 Project Overview

Stock AI Advisor is a production-ready intelligent stock analysis platform that provides AI-driven insights for S&P 500 stocks. The application leverages Claude AI for technical analysis, real-time market data from Finnhub, and AWS serverless infrastructure to deliver personalized investment recommendations and automated daily portfolio reports.

### Business Impact

✅ **Real-Time Market Data**: Live S&P 500 stock prices updated every 60 seconds
✅ **AI-Powered Analysis**: Claude AI generates BUY/HOLD/SELL recommendations with confidence scores
✅ **Automated Insights**: Daily email reports for opted-in users via EventBridge scheduling
✅ **Watchlist Management**: Track multiple stocks with personalized alerts
✅ **Portfolio Analytics**: Multi-stock analysis with risk metrics, sector diversification, and correlation insights
✅ **Serverless Architecture**: Auto-scaling infrastructure with zero server management

---

## 🛠 Technology Stack

### **Frontend Technologies**

- **Next.js 15** - React framework with App Router
- **React 19** - Modern UI library with concurrent features
- **TypeScript 5.8** - Type-safe development
- **TailwindCSS 4** - Utility-first CSS framework
- **Framer Motion 12** - Advanced animations
- **Recharts / Chart.js / Lightweight Charts** - Data visualizations
- **Amplify UI React** - Pre-built authentication components

### **Backend Technologies (AWS Amplify Gen 2)**

- **Node.js 20** - Lambda runtime environment
- **AWS Lambda** - Serverless compute (8 functions)
- **AWS AppSync** - GraphQL API with real-time subscriptions
- **Amazon DynamoDB** - NoSQL database (7 tables)
- **Amazon Cognito** - User authentication and authorization
- **Amazon SQS** - Message queue for batch processing
- **Amazon EventBridge** - Scheduled daily analysis triggers
- **AWS CDK** - Infrastructure as Code

### **AI/ML & External APIs**

- **Anthropic Claude (Haiku)** - Financial analysis and recommendations
- **Finnhub API** - Real-time stock market data (60 calls/min free tier)
- **AWS Secrets Manager** - Secure API key storage

### **Development Tools**

- **Git/GitHub** - Version control and repository hosting
- **npm** - Node package management
- **ESLint** - Code quality and linting
- **Amplify Sandbox** - Local cloud development environment
- **AWS CDK Toolkit** - Infrastructure deployment

### **Deployment & Infrastructure**

- **AWS Amplify Hosting** - CI/CD pipeline with automatic deployments
- **Amazon CloudWatch** - Logging and monitoring
- **AWS IAM** - Role-based access control
- **HTTPS/SSL** - Secure communication

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
│  React 19 + TypeScript + TailwindCSS + Framer Motion       │
└─────────────────────┬───────────────────────────────────────┘
                      │ GraphQL (AppSync) / HTTPS (Lambda URLs)
┌─────────────────────▼───────────────────────────────────────┐
│                  AWS Amplify Backend                        │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │   AppSync    │ │   Lambda     │ │   EventBridge     │  │
│  │   GraphQL    │ │   Functions  │ │   Scheduler       │  │
│  └──────┬───────┘ └──────┬───────┘ └─────────┬─────────┘  │
│         │                │                    │             │
│  ┌──────▼────────────────▼────────────────────▼─────────┐  │
│  │              Amplify Data Client (IAM Auth)           │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    DynamoDB Tables                          │
│  Portfolio | Watchlist | Analysis | MarketData | Alerts    │
└─────────────────────────────────────────────────────────────┘
```

### Event-Driven Architecture

```
EventBridge (9 AM ET) → Orchestrator Lambda
                            ↓
                    Query opted-in users
                            ↓
                    Send to SQS Queue
                            ↓
                    Worker Lambda (batch processing)
                            ↓
                    Generate AI analysis
                            ↓
                    Send email via SES
```

---

## ✨ Key Features

### **Customer-Facing Features**

🎨 **Interactive Stock Search** - Real-time search across 500+ S&P 500 stocks
📊 **AI-Powered Analysis** - Claude AI recommendations with confidence scores, price targets, and stop-loss levels
📈 **Live Price Data** - Finnhub integration with 1-minute caching to optimize API usage
⭐ **Watchlist Management** - Add stocks to personalized watchlist (no portfolio tracking)
🔔 **Smart Alerts** - Price threshold and AI signal notifications
📧 **Daily Insights** - Automated email reports for multi-stock watchlists
🎯 **Advanced Metrics** - True Shooting %, PER, Usage Rate, Risk Assessment
📱 **Mobile Responsive** - Optimized for all devices with dark mode support

### **Administrative Features**

📊 **User Management** - Cognito-powered authentication with email verification
🔐 **Role-Based Access** - Owner-based authorization for watchlists and portfolios
📈 **Usage Analytics** - CloudWatch metrics for Lambda execution and API calls
⚙️ **Service Configuration** - Dynamic stock data refresh intervals

### **Technical Features**

🚀 **Serverless Architecture** - Auto-scaling with pay-per-use pricing
🔄 **Event-Driven Processing** - EventBridge + SQS for reliable batch jobs
💾 **Caching Strategy** - 1-hour analysis cache, 1-minute price cache
🔒 **Secure Authentication** - Cognito User Pools with MFA support
🎯 **GraphQL First** - Type-safe API with real-time subscriptions
🧪 **Type Safety** - End-to-end TypeScript with generated types

---

## 💻 Installation & Setup

### **Prerequisites**

- **Node.js 20.x** (required for Amplify Gen 2)
- **npm 10.x** or **yarn**
- **Git**
- **AWS Account** (for deployment)
- **Finnhub API Key** ([Get Free Key](https://finnhub.io/register))
- **Anthropic API Key** ([Get API Key](https://console.anthropic.com/))

### **Local Development**

#### **1. Clone Repository**

```bash
git clone https://github.com/Alokothro/stock-ai-advisor.git
cd stock-ai-advisor
```

#### **2. Install Dependencies**

```bash
npm install
```

#### **3. Environment Configuration**

Create `.env.local` file in the project root:

```bash
FINNHUB_API_KEY=your_finnhub_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GROK_API_KEY=your_xai_api_key_here  # Optional
```

**⚠️ Security**: `.env.local` is in `.gitignore` - never commit API keys!

#### **4. Start Amplify Sandbox**

```bash
npx ampx sandbox
```

This will:
- Deploy backend resources to AWS (2-3 minutes first time)
- Generate `amplify_outputs.json` with API endpoints
- Watch for changes and auto-deploy

#### **5. Start Development Server**

In a **new terminal**:

```bash
npm run dev
```

Access the app at **http://localhost:3000**

#### **6. Configure Sandbox Secrets**

```bash
npx ampx sandbox secret set ANTHROPIC_API_KEY
# Enter your API key when prompted

npx ampx sandbox secret set FINNHUB_API_KEY
# Enter your API key when prompted
```

---

## 📡 API Documentation

### **GraphQL API (AppSync)**

#### **Query: List Watchlist**

```graphql
query MyWatchlist {
  listWatchlists(filter: { userId: { eq: "user-id-here" } }) {
    items {
      symbol
      name
      currentPrice
      percentChange24h
      alertPrice
      notes
    }
  }
}
```

#### **Mutation: Add to Watchlist**

```graphql
mutation AddStock {
  createWatchlist(input: {
    userId: "user-id"
    symbol: "AAPL"
    assetType: STOCK
    name: "Apple Inc."
  }) {
    symbol
    userId
  }
}
```

### **Lambda Function URLs**

#### **AI Analysis Endpoint**

```bash
POST https://<function-url>.lambda-url.us-east-1.on.aws/
Content-Type: application/json

{
  "symbol": "AAPL",
  "assetType": "STOCK"
}
```

**Response:**

```json
{
  "symbol": "AAPL",
  "recommendation": "BUY",
  "confidenceScore": 78.5,
  "priceTarget": 185.50,
  "stopLoss": 165.00,
  "reasoning": "Strong technical indicators with bullish momentum...",
  "riskLevel": "MEDIUM"
}
```

#### **Portfolio Analysis Endpoint**

```bash
POST https://<portfolio-function-url>.lambda-url.us-east-1.on.aws/
Content-Type: application/json

{
  "stocks": ["AAPL", "MSFT", "GOOGL"],
  "analysisType": "detailed"
}
```

---

## 🗄 Database Design

### **DynamoDB Tables (7 Total)**

#### **1. Portfolio Table**

| Field | Type | Description |
|-------|------|-------------|
| userId (PK) | String | Cognito user ID |
| symbol (SK) | String | Stock ticker symbol |
| quantity | Number | Number of shares |
| purchasePrice | Number | Average cost basis |
| currentPrice | Number | Latest market price |
| profitLoss | Number | Unrealized P&L |

#### **2. Watchlist Table**

| Field | Type | Description |
|-------|------|-------------|
| userId (PK) | String | User identifier |
| symbol (SK) | String | Stock symbol |
| alertPrice | Number | Price alert threshold |
| notes | String | User notes |

#### **3. MarketData Table**

| Field | Type | Description |
|-------|------|-------------|
| symbol (PK) | String | Stock ticker |
| currentPrice | Number | Latest price |
| percentChange24h | Number | Daily % change |
| volume | Number | Trading volume |
| lastUpdated | DateTime | Cache timestamp |

#### **4. Analysis Table**

| Field | Type | Description |
|-------|------|-------------|
| symbol (PK) | String | Stock symbol |
| timestamp (SK) | DateTime | Analysis creation time |
| recommendation | String | BUY/HOLD/SELL |
| confidenceScore | Number | 0-100 confidence |
| reasoning | String | AI explanation |

#### **5. UserStockPreferences Table**

| Field | Type | Description |
|-------|------|-------------|
| userId (PK) | String | User ID |
| selectedStocks | List | Array of watched symbols |
| dailyInsightsOptIn | Boolean | Email consent |
| lastAnalysisDate | DateTime | Last report sent |

---

## 🚀 Deployment

### **AWS Amplify Hosting**

#### **1. Connect GitHub Repository**

```bash
# Deploy to Amplify Console
npx ampx pipeline-deploy --branch main --app-id <your-app-id>
```

#### **2. Configure Build Settings**

The `amplify.yml` file is pre-configured:

```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npx ampx generate outputs --branch $AWS_BRANCH --app-id $AWS_APP_ID
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
```

#### **3. Set Environment Variables**

In Amplify Console → App Settings → Environment Variables:

```
ANTHROPIC_API_KEY=sk-ant-...
FINNHUB_API_KEY=...
NEXT_PUBLIC_AMPLIFY_REGION=us-east-1
```

#### **4. Deploy**

```bash
git push origin main
# Amplify automatically builds and deploys
```

---

## 🚧 Challenges & Solutions

### **1. API Rate Limiting**

**Challenge**: Finnhub free tier allows 60 calls/min
**Solution**: Implemented 1-minute in-memory cache for quotes + 1.1-second delay between batch calls
**Code**: `app/api/finnhub/quote/route.ts`

### **2. Lambda Cold Starts**

**Challenge**: First AI analysis takes 3-5 seconds
**Solution**: Show interactive "research phase" UI with progress steps while Lambda warms up
**Implementation**: `StockDetailViewAI.tsx` with animated loading states

### **3. Environment Variable Management**

**Challenge**: API keys exposed in git history
**Solution**: Used `git filter-repo` to scrub secrets + migrated to AWS Secrets Manager for production
**Security**: All keys now use `process.env` with no fallbacks

### **4. Scheduled Lambda Execution**

**Challenge**: EventBridge cron expression for Eastern Time (9 AM ET)
**Solution**: Converted to UTC (14:00) with weekday-only filter
**Code**: `amplify/backend.ts` Schedule.cron configuration

### **5. Amplify Data Client Setup**

**Challenge**: Lambda functions couldn't access DynamoDB
**Solution**: Added `resourceGroupName: 'data'` to function definitions for automatic IAM permissions
**Documentation**: Critical for Amplify Gen 2 Lambda-DynamoDB integration

---

## 🔮 Future Enhancements

### **Planned Features**

📊 **Advanced Charting** - Candlestick charts with technical indicators
💳 **Premium Tier** - Unlimited API calls and real-time WebSocket data
📱 **Mobile App** - React Native iOS/Android applications
🔔 **SMS Alerts** - Twilio integration for text notifications
🤖 **AI Chat** - Conversational interface for stock questions
🌐 **International Markets** - Expand beyond S&P 500
📈 **Backtesting** - Historical strategy simulation

### **Technical Improvements**

🧪 **Unit Testing** - Jest + React Testing Library
📦 **Docker** - Containerized development environment
🔄 **Redis Caching** - Distributed cache for multi-instance scaling
📊 **Datadog Integration** - Advanced monitoring and APM
🔒 **OAuth** - Social login (Google/Apple)

---

## 👨‍💻 Developer

**Alok Patel** - Computer Science Student | Software Engineering

📧 Email: alokothro@gmail.com
🔗 GitHub: [@Alokothro](https://github.com/Alokothro)
💼 LinkedIn: [Connect with me](https://linkedin.com/in/alokothro)

---

## 📞 Contact & Support

For questions, bug reports, or feature requests:

📧 **Email**: alokothro@gmail.com
🐛 **Issues**: [GitHub Issues](https://github.com/Alokothro/stock-ai-advisor/issues)
💬 **Discussions**: [GitHub Discussions](https://github.com/Alokothro/stock-ai-advisor/discussions)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🏆 Project Highlights

✅ **Production-Ready Architecture** with AWS serverless infrastructure
✅ **AI-Powered Insights** using Anthropic Claude for financial analysis
✅ **Real-Time Data** integration with Finnhub API
✅ **Event-Driven Design** using EventBridge and SQS for scalability
✅ **Type-Safe Development** with end-to-end TypeScript
✅ **Secure Authentication** via AWS Cognito with MFA support
✅ **Infrastructure as Code** using AWS CDK for reproducible deployments
✅ **Modern Frontend** with Next.js 15 and React 19
✅ **Database Optimization** with DynamoDB composite keys and GSIs
✅ **CI/CD Pipeline** with automatic deployments via Amplify Hosting

---

**⭐ Star this repo** if you find it useful for your learning or projects!
