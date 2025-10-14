// services/cacheUpdater.js
import CacheMessage from "../models/CacheMessage.js";
import IgnoreThread from "../models/ignoredThread.model.js";
import Keyword from "../models/keyword.model.js";
import { fetchReadUnrepliedMessages } from "./gmailService.js";
import { updateCachedMessages } from "./updateCachedMessages.js";

let updating = false;

async function getConfig() {
  const keywordDoc = await Keyword.findOne();
  const keywords = keywordDoc?.words || [];
  const daysRange = parseInt(process.env.DAYS_RANGE) || 3;
  return { keywords, daysRange };
}

export async function updateCache() {
  if (updating) return;
  updating = true;

  try {
    // 🧠 Ignore’larni olish
    const ignoredDocs = await IgnoreThread.find({}, "threadId");
    const ignoredThreadIds = ignoredDocs.map(doc => doc.threadId);

    // 🧠 Config (keyword, days)
    const CONFIG = await getConfig();

    // 🔄 Gmail’dan unreplied xabarlarni olish
    await fetchReadUnrepliedMessages(CONFIG.keywords, CONFIG.daysRange, ignoredThreadIds);

    // 🧹 Ignore’larni MongoDB’dan o‘chirish
    if (ignoredThreadIds.length) {
      await CacheMessage.deleteMany({ threadId: { $in: ignoredThreadIds } });
      console.log(`🧹 ${ignoredThreadIds.length} ta ignore qilingan xabar o‘chirildi. ${new Date()}`);
    }

    // ✅ Javob yozilgan xabarlarni tekshirib o‘chirish
    await updateCachedMessages();

  } catch (e) {
    console.error("Cache update xatolik:", e);
  } finally {
    updating = false;
  }
}

export function startCacheUpdater() {
  console.log("🕒 Cache updater ishga tushdi...");
  setInterval(updateCache, 60 * 1000); // har 1 daqiqada
}
