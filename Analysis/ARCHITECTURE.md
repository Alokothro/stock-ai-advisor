# Analysis Module Architecture

## Folder Structure

```
Analysis/
│
├── README.md                    # Module overview and purpose
├── ARCHITECTURE.md              # This file - detailed structure
├── requirements.txt             # Python dependencies
├── config.py                    # Configuration and API keys
│
├── data_fetchers/               # Data acquisition layer
│   ├── __init__.py
│   ├── finnhub_fetcher.py      # Finnhub API data fetcher
│   ├── grok_fetcher.py         # Grok.AI API data fetcher
│   └── news_scraper.py         # Web scraping for news
│
├── data/                        # Raw and processed data storage
│   ├── raw/                    # Raw data from APIs
│   │   ├── finnhub/            # Finnhub data by date
│   │   │   ├── 2025-01-20/
│   │   │   │   ├── quotes.csv
│   │   │   │   ├── candles.csv
│   │   │   │   └── profiles.csv
│   │   │   └── latest/         # Symlink to most recent
│   │   │
│   │   ├── grok/               # Grok.AI sentiment data
│   │   │   ├── 2025-01-20/
│   │   │   │   ├── sentiment.csv
│   │   │   │   └── tweets.csv
│   │   │   └── latest/
│   │   │
│   │   └── news/               # Scraped news data
│   │       ├── 2025-01-20/
│   │       │   └── articles.csv
│   │       └── latest/
│   │
│   └── processed/              # Cleaned and merged data
│       ├── 2025-01-20/
│       │   ├── merged_data.csv
│       │   └── features.csv
│       └── latest/
│
├── analyzers/                  # Analysis algorithms
│   ├── __init__.py
│   ├── momentum_analyzer.py   # Momentum indicators (RSI, MACD, etc.)
│   ├── pattern_detector.py    # Chart pattern recognition
│   ├── correlation_finder.py  # Multi-stock correlation
│   └── time_series.py         # ARIMA, forecasting
│
├── ml_models/                  # Machine learning models
│   ├── __init__.py
│   ├── train_model.py         # Model training pipeline
│   ├── predict.py             # Prediction interface
│   ├── models/                # Saved model files
│   │   └── .gitkeep
│   └── features/              # Feature engineering
│       └── feature_builder.py
│
├── utils/                      # Utility functions
│   ├── __init__.py
│   ├── data_validator.py     # Data quality checks
│   ├── date_utils.py         # Date/time helpers
│   └── logger.py             # Logging configuration
│
├── reports/                    # Analysis outputs
│   ├── 2025-01-20/
│   │   ├── daily_analysis.json
│   │   ├── predictions.csv
│   │   └── momentum_report.html
│   └── latest/
│
├── scripts/                    # Executable scripts
│   ├── run_daily_fetch.py    # Daily data fetch job
│   ├── run_analysis.py       # Run full analysis pipeline
│   ├── backtest.py           # Backtesting strategies
│   └── generate_report.py    # Create HTML/PDF reports
│
└── tests/                      # Unit tests
    ├── __init__.py
    ├── test_fetchers.py
    ├── test_analyzers.py
    └── test_models.py
```

## Data Flow

```
1. Data Fetching (Python Scripts)
   ┌─────────────┐     ┌──────────┐     ┌──────────┐
   │  Finnhub    │────▶│  CSV     │────▶│  data/   │
   │  API        │     │  Export  │     │  raw/    │
   └─────────────┘     └──────────┘     └──────────┘
   
   ┌─────────────┐     ┌──────────┐     ┌──────────┐
   │  Grok.AI    │────▶│  CSV     │────▶│  data/   │
   │  API        │     │  Export  │     │  raw/    │
   └─────────────┘     └──────────┘     └──────────┘

2. Data Processing
   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │  Raw     │────▶│  Clean   │────▶│Processed │
   │  CSVs    │     │  Merge   │     │  Data    │
   └──────────┘     └──────────┘     └──────────┘

3. Analysis Pipeline
   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │Processed │────▶│ Analyze  │────▶│ Reports  │
   │  Data    │     │ Patterns │     │  JSON/   │
   └──────────┘     └──────────┘     │  HTML    │
                                      └──────────┘
```

## Key Python Files

### Data Fetchers
- `finnhub_fetcher.py`: Fetches quotes, candles, company profiles
- `grok_fetcher.py`: Gets Twitter sentiment, trending topics
- `news_scraper.py`: Scrapes financial news sites

### Analyzers
- `momentum_analyzer.py`: RSI, MACD, Stochastic, ROC
- `pattern_detector.py`: Head & shoulders, triangles, flags
- `correlation_finder.py`: Pearson correlation, cointegration
- `time_series.py`: ARIMA, Prophet, LSTM forecasting

### Scripts
- `run_daily_fetch.py`: Scheduled job for daily data pull
- `run_analysis.py`: Main analysis pipeline executor
- `backtest.py`: Strategy backtesting framework
- `generate_report.py`: HTML/PDF report generator

## CSV File Formats

### finnhub/quotes.csv
```
symbol,timestamp,current,open,high,low,prev_close,change,change_pct,volume
AAPL,2025-01-20 16:00:00,150.25,148.50,151.00,148.00,149.00,1.25,0.84,75000000
```

### grok/sentiment.csv
```
symbol,timestamp,sentiment_score,bullish_count,bearish_count,neutral_count,influence_score
AAPL,2025-01-20 16:00:00,0.75,1250,320,450,8500
```

### processed/merged_data.csv
```
symbol,timestamp,price,volume,sentiment,momentum_rsi,pattern,prediction
AAPL,2025-01-20 16:00:00,150.25,75000000,0.75,65.5,ascending_triangle,152.00
```