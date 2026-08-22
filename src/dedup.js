import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SEEN_FILE_PATH = path.join(process.cwd(), 'seen.json');
const MAX_SEEN_IDS = 500;

export function readSeenIds() {
  try {
    if (fs.existsSync(SEEN_FILE_PATH)) {
      const data = fs.readFileSync(SEEN_FILE_PATH, 'utf8');
      const json = JSON.parse(data);
      return json.seenIds || [];
    }
  } catch (error) {
    console.error('Error reading seen.json:', error.message);
  }
  return [];
}

export function writeSeenIds(seenIds) {
  try {
    if (seenIds.length > MAX_SEEN_IDS) {
      seenIds = seenIds.slice(seenIds.length - MAX_SEEN_IDS);
    }
    fs.writeFileSync(SEEN_FILE_PATH, JSON.stringify({ seenIds }, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing seen.json:', error.message);
  }
}

export function generateArticleId(article) {
  const rawId = article.guid || article.link;
  if (!rawId) return null;
  
  return crypto.createHash('sha256').update(rawId).digest('hex').substring(0, 16);
}

export function filterNewArticles(articles) {
  const seenIds = readSeenIds();
  const newArticles = [];
  const newSeenIds = [...seenIds];

  for (const article of articles) {
    const id = generateArticleId(article);
    if (!id) continue;

    if (!seenIds.includes(id) && !newSeenIds.includes(id)) {
      newArticles.push({ ...article, id });
      newSeenIds.push(id);
    }
  }

  return { newArticles, updatedSeenIds: newSeenIds };
}
