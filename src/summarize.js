import Groq from 'groq-sdk';

let groqClient = null;

function getGroq() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

const SYSTEM_PROMPT = "You are a financial news summarizer for retail traders with no professional background. Given a news headline and snippet, write a 2-line plain-language summary: line 1 = what happened, line 2 = why a retail trader in crypto/stocks/forex should care, using simple words, no jargon. Do not give financial advice or specific buy/sell instructions. Max 240 characters total.";

export async function summarizeArticle(article) {
  const groq = getGroq();
  const userMessage = `Title: ${article.title}\nSnippet: ${article.description}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        model: 'groq/compound-mini',
        temperature: 0.7,
        max_tokens: 150,
      });

      const content = chatCompletion.choices[0]?.message?.content?.trim();

      if (content && content.length > 10) {
        return content;
      }

      console.warn(`  ⚠ Empty response on attempt ${attempt}/3, retrying...`);
      await new Promise(r => setTimeout(r, 2000));

    } catch (error) {
      console.error(`  ✗ Error on attempt ${attempt}/3 for "${article.title}":`, error.status, JSON.stringify(error.error || error.message));
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.error(`  ✗ All 3 attempts failed for: "${article.title}"`);
  return null;
}

const SCORE_PROMPT = `You are a financial news editor. Rate the importance of this news headline for a retail crypto/stocks/forex trader on a scale of 1 to 10.

Scoring guide:
- 9-10: Major market-moving event (Fed rate decision, crash, huge % price move, major hack/exploit, regulatory ban)
- 7-8: Significant news (notable price moves >5%, ETF approvals, important earnings, big regulatory update)
- 5-6: Moderately relevant (general market updates, minor price moves, analyst opinions)
- 3-4: Low relevance (insider stock sales, minor company news, old news rehashed)
- 1-2: Not relevant (spam, unrelated to trading)

Reply with ONLY a single integer number between 1 and 10. No explanation, no other text.`;

export async function scoreArticleImportance(article) {
  const groq = getGroq();
  const userMessage = `Headline: ${article.title}`;

  try {
    const res = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SCORE_PROMPT },
        { role: 'user', content: userMessage }
      ],
      model: 'groq/compound-mini',
      temperature: 0.1,
      max_tokens: 5,
    });

    const raw = res.choices[0]?.message?.content?.trim();
    const score = parseInt(raw, 10);

    return isNaN(score) ? 5 : Math.min(10, Math.max(1, score));
  } catch (error) {
    console.warn(`  ⚠ Scoring failed for "${article.title}", defaulting to 5`);
    return 5;
  }
}
