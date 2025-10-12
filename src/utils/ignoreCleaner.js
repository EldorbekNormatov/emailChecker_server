import IgnoreThread from "../models/ignoredThread.model.js";


export function startIgnoreCleaner() {
  setInterval(async () => {
    const EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000; // 24 soat
    const expireDate = new Date(Date.now() - EXPIRE_TIME);

    try {
      const result = await IgnoreThread.deleteMany({ ignoredAt: { $lt: expireDate } });
      if (result.deletedCount > 0) {
        console.log(`[🧹 IgnoreCleaner] ${result.deletedCount} ta eski ignore o‘chirildi`);
      }
    } catch (error) {
      console.error("[🧹 IgnoreCleaner Error]", error);
    }
  }, 10 * 60 * 1000); // Har 10 daqiqa
}
