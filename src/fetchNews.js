import Parser from 'rss-parser';

const parser = new Parser();

const FEEDS = [
  'https://cryptopanic.com/news/rss/',
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://news.google.com/rss/search?q=fed+OR+bonds+OR+treasury+yields+when:1d',
  'https://news.google.com/rss/search?q=stock+market+news+when:1d'
  // TODO: Integrate Forex Factory or Trading Economics calendar feed
];

export async function fetchAllNews() {
  const allArticles = [];

  for (const feedUrl of FEEDS) {
    try {
      console.log(`Fetching feed: ${feedUrl}`);
      const feed = await parser.parseURL(feedUrl);
      
      feed.items.forEach(item => {
        allArticles.push({
          title: item.title,
          link: item.link,
          description: item.contentSnippet || item.content || item.description || '',
          guid: item.guid || item.id || item.link,
          pubDate: item.pubDate
        });
      });
    } catch (error) {
      console.error(`Error fetching feed ${feedUrl}:`, error.message);
    }
  }

  return allArticles;
}
