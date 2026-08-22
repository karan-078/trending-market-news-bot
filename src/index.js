import 'dotenv/config';
import { fetchAllNews } from './fetchNews.js';
import { filterNewArticles, writeSeenIds } from './dedup.js';
import { summarizeArticle, scoreArticleImportance } from './summarize.js';
import { sendTelegramMessage } from './sendTelegram.js';

const MAX_ARTICLES_PER_RUN = 4;
const MIN_IMPORTANCE_SCORE = 8;
const RATE_LIMIT_DELAY_MS = 1500;
const SCORING_DELAY_MS = 800;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('Starting News-to-Trade Summary Bot...');

  const allArticles = await fetchAllNews();
  console.log(`Fetched ${allArticles.length} total articles from feeds.`);

  if (allArticles.length === 0) {
    console.log('No articles fetched. Exiting.');
    return;
  }

  const { newArticles, updatedSeenIds } = filterNewArticles(allArticles);
  console.log(`Found ${newArticles.length} new articles since last run.`);

  if (newArticles.length === 0) {
    console.log('No new articles. Exiting.');
    return;
  }

  console.log(`\nScoring articles (need ${MAX_ARTICLES_PER_RUN} with score ≥ ${MIN_IMPORTANCE_SCORE}/10, early-exit when found)...`);
  const scoredArticles = [];

  for (const article of newArticles) {
    if (scoredArticles.length >= MAX_ARTICLES_PER_RUN) break;

    await delay(SCORING_DELAY_MS);
    const score = await scoreArticleImportance(article);
    console.log(`  [${score}/10] ${article.title}`);

    if (score >= MIN_IMPORTANCE_SCORE) {
      scoredArticles.push({ ...article, score });
      console.log(`  ✅ Added (${scoredArticles.length}/${MAX_ARTICLES_PER_RUN})`);
    }
  }

  console.log(`\nFound ${scoredArticles.length} important article(s) to send.\n`);

  let sentCount = 0;
  for (const article of scoredArticles) {
    console.log(`Summarizing & sending: ${article.title}`);
    await delay(RATE_LIMIT_DELAY_MS);

    const summary = await summarizeArticle(article);

    if (summary) {
      const message = `📰 <b>${article.title}</b>\n${summary}\n\n🔗 ${article.link}`;
      await sendTelegramMessage(message);
      sentCount++;
      await delay(RATE_LIMIT_DELAY_MS);
    } else {
      console.log(`  ⚠ Skipping (summarization failed): ${article.title}`);
    }
  }

  console.log(`\nSent ${sentCount} message(s) to Telegram.`);

  writeSeenIds(updatedSeenIds);
  console.log('Updated seen.json. Pipeline finished successfully.');
}

main().catch(error => {
  console.error('Fatal error in pipeline:', error);
  process.exit(1);
});
