import IgnoreThread from "../models/ignoredThread.model.js";
import Keyword from "../models/keyword.model.js";
import { fetchReadUnrepliedMessages } from "./gmailService.js";

export let cache = { results: [], time: 0 };

async function getConfig() {
  const keywordDoc = await Keyword.findOne();
  const keywords = keywordDoc?.words || [];
  const daysRange = parseInt(process.env.DAYS_RANGE) || 5;
  return { keywords, daysRange };
}

let updating = false;

export async function updateCache() {
  if (updating) return;
  updating = true;

  try {
    const CONFIG = await getConfig();

    const ignoredDocs = await IgnoreThread.find({}, "threadId");
    const ignoredThreadIds = ignoredDocs.map(doc => doc.threadId);

    const results = await fetchReadUnrepliedMessages(CONFIG.keywords, CONFIG.daysRange, ignoredThreadIds);

    cache = { results, time: Date.now() };
    console.log(`Cache yangilandi: ${results.length} xabar (ignorlar chiqarib tashlandi)`);
  } catch (e) {
    console.error("Cache update xatolik:", e);
  } finally {
    updating = false;
  }
}

export function startCacheUpdater() {
  setInterval(updateCache, 60 * 1000);
}
