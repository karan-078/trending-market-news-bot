# News-to-Trade Summary Bot

An automated pipeline that fetches financial and crypto news from RSS feeds, scores them for market relevance using LLMs, and sends concise, actionable summaries directly to a Telegram channel. Designed to run at $0 cost using GitHub Actions.

## Features

- **Automated News Aggregation:** Pulls from multiple RSS sources (CryptoPanic, CoinDesk, Google News for Treasury yields/stock market).
- **AI-Powered Scoring & Filtering:** Uses the Groq API (free tier) to score articles (1-10) based on market impact, filtering out noise and low-relevance news.
- **Smart Summarization:** Generates 2-line plain-language summaries focused on what happened and why a retail trader should care.
- **Deduplication:** Maintains state (`seen.json`) to prevent duplicate processing, persisting across GitHub Actions runs.
- **Rate Limit Handling:** Built-in delays to respect both Groq and Telegram API rate limits.
- **Serverless Execution:** Scheduled via GitHub Actions cron workflows.

## Prerequisites

- Node.js (v20+)
- A Groq API Key (Free tier)
- A Telegram Bot Token & Chat ID

## Setup & Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd News-to-trade-summry
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   ```

4. **Run the bot:**
   ```bash
   npm start
   ```

## Configuration

You can tune the bot's behavior in `src/index.js`:
- `MAX_ARTICLES_PER_RUN` (default: 4): Limits the number of messages sent per cycle to keep the channel clean.
- `MIN_IMPORTANCE_SCORE` (default: 8): The minimum LLM-assigned score an article needs to be forwarded.

## Deployment (GitHub Actions)

This bot is designed to be fully automated via GitHub Actions.

1. Push your code to a private GitHub repository.
2. Go to **Settings > Secrets and variables > Actions** and add the following repository secrets:
   - `GROQ_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
3. The included workflow (`.github/workflows/run-bot.yml`) will automatically trigger based on the defined cron schedule (e.g., every 15 minutes).
4. The workflow automatically commits updates to `seen.json` back to the repository to maintain state.

## Architecture

- `src/fetchNews.js`: Handles RSS parsing.
- `src/dedup.js`: Manages the state of seen articles to avoid duplicates.
- `src/summarize.js`: Integrates with the Groq SDK for scoring and summarization.
- `src/sendTelegram.js`: Delivers the final payloads to Telegram.
- `src/index.js`: Orchestrates the pipeline.
