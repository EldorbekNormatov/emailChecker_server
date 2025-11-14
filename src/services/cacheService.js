
import CacheMessage from "../models/CacheMessage.js";
import IgnoreThread from "../models/ignoredThread.model.js";
import Keyword from "../models/keyword.model.js";
import { fetchReadUnrepliedMessages } from "./gmailService.js";
import { updateCachedMessages } from "./updateCachedMessages.js";

let updating = false;
let lastUpdateCheck = 0; // Javob yozilgan xabarlarni o‘chirish uchun vaqt nazorati

// 🧠 Config (keywords va kun oraliq)
async function getConfig() {
  const keywordDoc = await Keyword.findOne();
  const keywords = keywordDoc?.words || [];
  const daysRange = parseInt(process.env.DAYS_RANGE) || 3;
  return { keywords, daysRange };
}

// 🔁 Asosiy yangilash funksiyasi
export async function updateCache() {
  if (updating) {
    console.log("⚠️ updateCache hozircha band, o'tkazib yuborildi.");
    return;
  }
  updating = true;

  try {
    console.log("🔄 Cache yangilanmoqda...");

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
    }

    // ✅ Javob yozilgan xabarlarni 7 daqiqada 1 marta tekshirish
    const now = Date.now();
    if (now - lastUpdateCheck > 7 * 60 * 1000) {
      console.log(`🧹 Javob berilgan xabarlar tozalanmoqda... ${new Date()}`);
      await updateCachedMessages();
      lastUpdateCheck = now;
    }

  } catch (e) {
    console.error("❌ Cache update xatolik:", e.message);
  } finally {
    updating = false;
  }
}

// 🕒 Updater’ni ishga tushirish
export function startCacheUpdater() {
  console.log("🚀 Cache updater ishga tushdi (10 daqiqa interval bilan).");

  // Random offset (API throttlingni kamaytirish uchun)
  const initialDelay = Math.floor(Math.random() * 10000); // 0–10s
  setTimeout(() => {
    updateCache(); // birinchi ishga tushish
    // har 10 daqiqada qayta ishga tushuish
    setInterval(updateCache, 10 * 60 * 1000); 
  }, initialDelay);
}
































// import CacheMessage from "../models/CacheMessage.js";
// import IgnoreThread from "../models/ignoredThread.model.js";
// import Keyword from "../models/keyword.model.js";
// import { fetchReadUnrepliedMessages } from "./gmailService.js";
// import { updateCachedMessages } from "./updateCachedMessages.js";

// let updating = false;
// let lastUpdateCheck = 0; // Javob yozilgan xabarlarni o‘chirish uchun vaqt nazorati

// // 🧠 Config (keywords va kun oraliq)
// async function getConfig() {
//   const keywordDoc = await Keyword.findOne();
//   const keywords = keywordDoc?.words || [];
//   const daysRange = parseInt(process.env.DAYS_RANGE) || 3;
//   return { keywords, daysRange };
// }

// // 🔁 Asosiy yangilash funksiyasi
// export async function updateCache() {
//   if (updating) {
//     console.log("⚠️ updateCache hozircha band, o'tkazib yuborildi.");
//     return;
//   }
//   updating = true;

//   try {
//     console.log("🔄 Cache yangilanmoqda...");

//     // 🧠 Ignore’larni olish
//     const ignoredDocs = await IgnoreThread.find({}, "threadId");
//     const ignoredThreadIds = ignoredDocs.map(doc => doc.threadId);

//     // 🧠 Config (keyword, days)
//     const CONFIG = await getConfig();

//     // 🔄 Gmail’dan unreplied xabarlarni olish
//     await fetchReadUnrepliedMessages(CONFIG.keywords, CONFIG.daysRange, ignoredThreadIds);

//     // 🧹 Ignore’larni MongoDB’dan o‘chirish
//     if (ignoredThreadIds.length) {
//       await CacheMessage.deleteMany({ threadId: { $in: ignoredThreadIds } });
//     }

//     // ✅ Javob yozilgan xabarlarni 30 daqiqada 1 marta tekshirish
//     const now = Date.now();
//     if (now - lastUpdateCheck > 7 * 60 * 1000) {
//       console.log("🧹 Javob berilgan xabarlar tozalanmoqda...");
//       await updateCachedMessages();
//       lastUpdateCheck = now;
//     }

//   } catch (e) {
//     console.error("❌ Cache update xatolik:", e.message);
//   } finally {
//     updating = false;
//   }
// }

// // 🕒 Updater’ni ishga tushirish
// export function startCacheUpdater() {
//   console.log("🚀 Cache updater ishga tushdi (10 daqiqa interval bilan).");

//   // Random offset (API throttlingni kamaytirish uchun)
//   const initialDelay = Math.floor(Math.random() * 10000); // 0–10s
//   setTimeout(() => {
//     updateCache(); // birinchi ishga tushish
//     // har 10 daqiqada qayta ishga tushuish
//     setInterval(updateCache, 10 * 60 * 1000); 
//   }, initialDelay);
// }
