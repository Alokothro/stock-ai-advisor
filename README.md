# Stock AI Advisor 📈🤖

An AI-powered stock analysis app built with Next.js and Anthropic Claude. Search any S&P 500 stock and get a BUY/HOLD/SELL recommendation that combines a deterministic quantitative decision engine with Claude's live web research — not just an LLM guessing from a price.

🚀 **Live Demo**: [Coming Soon]

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Anthropic Claude](https://img.shields.io/badge/AI-Claude_Sonnet_5-8A2BE2)](https://www.anthropic.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![AWS Amplify](https://img.shields.io/badge/Auth-AWS_Amplify_Cognito-FF9900)](https://aws.amazon.com/amplify/)

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Installation & Setup](#-installation--setup)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Challenges & Solutions](#-challenges--solutions)
- [Future Enhancements](#-future-enhancements)

---

## 🎯 Project Overview

Stock AI Advisor lets you search any of the 500+ S&P 500 stocks and get an AI-generated investment recommendation. Under the hood, every analysis runs through two independent systems that are then reconciled: an internal quantitative decision engine that scores momentum, 52-week range position, and analyst consensus, and Claude AI performing live web research on the same stock. Claude is instructed to weigh the quant signal rather than freelance a recommendation from stale training data.

### Highlights

✅ **Real-Time Market Data**: Live quotes, analyst price targets, and recent news via Finnhub
✅ **Quant Decision Engine**: Deterministic -100 to +100 trend score from momentum, 52-week range, and analyst consensus
✅ **AI Research with Live Web Search**: Claude searches the web for current news/earnings before recommending
✅ **Transparent Reasoning**: Every recommendation shows the specific quant factors that drove it, not just a black-box score
✅ **Secure Authentication**: AWS Cognito via Amplify

---

## 🛠 Technology Stack

### **Frontend**

- **Next.js 15** - React framework with App Router
- **React 19** - Modern UI library
- **TypeScript 5.8** - Type-safe development
- **TailwindCSS 4** - Utility-first CSS framework
- **Framer Motion 12** - Animations and transitions
- **Canvas-based particle system** - Custom animated loading state (no external animation library)
- **Amplify UI React** - Authentication components

### **Backend / API**

- **Next.js API Routes** - Serverless-style route handlers (`/api/ai/analyze`, `/api/finnhub/quote`)
- **Anthropic Claude (Sonnet 5)** - Financial analysis, with the hosted `web_search` tool enabled for live research
- **Finnhub API** - Real-time quotes, analyst recommendation trends, price targets, company news, 52-week/valuation metrics
- **Custom Quant Decision Engine** (`lib/decision-engine.ts`) - Deterministic technical/analyst scoring, independent of the LLM

### **Auth & Infra**

- **AWS Amplify (Gen 2)** - Cognito-backed authentication
- **AWS Cognito** - User authentication and authorization

### **Development Tools**

- **Git/GitHub** - Version control
- **npm** - Package management
- **ESLint** - Code quality and linting
- **TypeScript compiler** - Static type checking

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                          │
│   React 19 + TypeScript + TailwindCSS + Framer Motion        │
│   (Cognito auth via AWS Amplify)                              │
└─────────────────────┬───────────────────────────────────────┘
                       │ HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│                  Next.js API Routes                          │
│  /api/finnhub/quote          /api/ai/analyze                 │
└──────────┬────────────────────────────┬─────────────────────┘
           │                            │
┌──────────▼──────────┐     ┌───────────▼──────────────────────┐
│   Finnhub API        │     │  Quant Decision Engine            │
│   quote, analyst      │────▶  (momentum, 52wk range,           │
│   recs, price target, │     │   analyst consensus, targets)     │
│   news, financials     │     └───────────┬──────────────────────┘
└──────────────────────┘                  │
                                ┌───────────▼──────────────────────┐
                                │  Claude (Sonnet 5) + web_search   │
                                │  Reconciles quant signal with     │
                                │  live research → final call       │
                                └────────────────────────────────────┘
```

---

## ✨ Key Features

### **Analysis Features**

🎨 **Interactive Stock Search** - Live-filtered dropdown across 500+ S&P 500 stocks, searchable even while viewing another stock's detail
📊 **AI-Powered Analysis** - Claude recommendation with confidence score, price target, and risk level
🔍 **Live Web Research** - Claude actively searches the web for recent news, earnings, and analyst rating changes before answering
📐 **Quant Signal Panel** - Shows the exact momentum/analyst/range factors that produced the internal score
📈 **Live Price Data** - Real-time Finnhub quotes with day range and % change
⚠️ **Transparent Failure States** - If AI research fails, the app shows a visible fallback based on the quant engine instead of pretending it's a full analysis
🎆 **Particle Sphere Loading Animation** - Custom canvas-based bronze particle cloud during analysis (click it 5x fast for a surprise)
📱 **Dark Mode UI** - Built dark-first with a bronze/black theme

### **Technical Features**

🔒 **Secure Authentication** - Cognito User Pools via AWS Amplify
🎯 **Race-Condition Safe** - Switching stocks mid-analysis can't overwrite the wrong stock's data
🧪 **Type Safety** - End-to-end TypeScript

---

## 💻 Installation & Setup

### **Prerequisites**

- **Node.js 20+**
- **npm**
- **Git**
- **Finnhub API Key** ([Get Free Key](https://finnhub.io/register))
- **Anthropic API Key** ([Get API Key](https://console.anthropic.com/))
- **AWS Account** (only needed if you want to run/redeploy the Amplify auth backend)

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

Create `.env.local` in the project root:

```bash
FINNHUB_API_KEY=your_finnhub_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**⚠️ Security**: `.env.local` is in `.gitignore` — never commit API keys.

#### **4. Start Development Server**

```bash
npm run dev
```

Access the app at **http://localhost:3000**

Cognito auth relies on `amplify_outputs.json`, which is committed to the repo. If you need to redeploy your own Amplify auth backend, run `npx ampx sandbox` to regenerate it.

---

## 📡 API Documentation

### **POST `/api/ai/analyze`**

Runs the full analysis pipeline: fetches quote + analyst data from Finnhub, computes the quant signal, then calls Claude (with live web search) to produce the final recommendation.

```bash
POST /api/ai/analyze
Content-Type: application/json

{
  "symbol": "AAPL"
}
```

**Response:**

```json
{
  "symbol": "AAPL",
  "quote": { "c": 233.74, "d": 0.48, "dp": 0.14, "name": "Apple Inc", "sector": "Technology" },
  "analysis": {
    "recommendation": "BUY",
    "confidence": 66,
    "reasoning": "...",
    "priceTarget": 358,
    "riskLevel": "MEDIUM",
    "timeHorizon": "medium-term (3-6 months)",
    "quantSignal": {
      "score": 34,
      "label": "BUY",
      "factors": ["Near 52-week high", "Analyst consensus: 36 buy / 16 hold / 2 sell (54 analysts)"]
    }
  }
}
```

### **GET `/api/finnhub/quote`**

Proxies a real-time quote for a single symbol.

```bash
GET /api/finnhub/quote?symbol=AAPL
```

---

## 🚀 Deployment

This app can be deployed to either **Render** or **AWS Amplify Hosting**.

### **Render**

1. Connect the GitHub repo as a new **Web Service**
2. Build command: `npm install && npm run build`
3. Start command: `npm run start`
4. Set environment variables: `FINNHUB_API_KEY`, `ANTHROPIC_API_KEY`

Note: `amplify_outputs.json` must be committed to the repo (it is) since Render only builds from what's in git.

### **AWS Amplify Hosting**

The `amplify.yml` file is pre-configured for Amplify's build pipeline:

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

Set `ANTHROPIC_API_KEY` and `FINNHUB_API_KEY` in Amplify Console → App Settings → Environment Variables, then push to `main` to trigger a build.

---

## 🚧 Challenges & Solutions

### **1. Generic AI Fallbacks Masking Real Failures**

**Challenge**: When the Claude API call failed or its response couldn't be parsed, the app silently returned a canned "Unable to perform complete analysis" response that looked identical to a real recommendation.
**Solution**: Added an `isFallback` flag threaded from the Anthropic service through the API to the UI, surfaced as a visible warning banner. Fallbacks now also lean on the quant engine's actual score instead of a generic message.

### **2. Race Conditions on Rapid Stock Switching**

**Challenge**: Switching stocks while an analysis was still in flight could let a slow response for the old stock overwrite the newly selected stock's data.
**Solution**: Added a symbol ref guard so stale responses are discarded if the selected symbol has changed by the time they resolve.

### **3. Search Becoming Inert on Detail View**

**Challenge**: The search bar stayed visible but did nothing once a stock's detail view was open, since its only consumer (the dashboard grid) was unmounted at that point.
**Solution**: Added a live-filtered dropdown wired directly to stock selection, independent of the dashboard grid.

### **4. Gitignored File Breaking Production Builds**

**Challenge**: `amplify_outputs.json` was gitignored, so any host building from a fresh `git clone` (e.g. Render) failed with `Module not found`.
**Solution**: Committed `amplify_outputs.json` — it's Amplify endpoint config, not a secret; auth is still enforced server-side by Cognito.

### **5. Grounding AI Recommendations in Real Signal**

**Challenge**: Asking Claude for a recommendation from a single price point produced generic, low-confidence-feeling analysis with no reproducible basis.
**Solution**: Built an internal quant decision engine (`lib/decision-engine.ts`) that deterministically scores momentum, 52-week range position, analyst consensus, and price-target upside, then passed that score into Claude's prompt as a hard input alongside live web search — Claude must justify any disagreement with it.

---

## 🔮 Future Enhancements

### **Planned Features**

📊 **Advanced Charting** - Candlestick charts with technical indicators
⭐ **Watchlist Persistence** - Amplify Data schema for watchlists already scaffolded (`amplify/data/resource.ts`), not yet wired to the UI
📧 **Daily Email Digests** - Scheduled analysis summaries for watched stocks
🤖 **AI Chat** - Conversational interface for follow-up stock questions
🌐 **International Markets** - Expand beyond S&P 500
📈 **Backtesting** - Historical strategy simulation

### **Technical Improvements**

🧪 **Unit Testing** - Vitest/Jest coverage for the quant decision engine
🚦 **Rate Limiting** - Cap requests to `/api/ai/analyze` to control Anthropic API costs
♿ **Accessibility Pass** - Full keyboard nav and screen-reader labeling across the app
📊 **Analytics** - Basic usage tracking (Plausible or Vercel Analytics)

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

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**⭐ Star this repo** if you find it useful for your learning or projects!
