import MessageSendCount from "../models/messageSendCount.model.js";
import { DateTime } from "luxon";

export const cleanupOldMessagesNY = async () => {
  try {
    // New York vaqtida hozirgi vaqt (DST avtomatik)
    const nyNow = DateTime.now().setZone("America/New_York");

    // Bugun boshlanishi (00:00 New York)
    const todayStart = nyNow.startOf("day");

    // Kecha boshlanishi
    const yesterdayStart = todayStart.minus({ days: 1 });

    // UTC formatga aylantiramiz (Mongo shu format bilan ishlaydi)
    const yesterdayStartUTC = new Date(yesterdayStart.toUTC().toISO());

    const result = await MessageSendCount.deleteMany({
      sentAt: { $lt: yesterdayStartUTC }
    });

    console.log(`🗑️ Deleted ${result.deletedCount} old messages (NY time)`);
  } catch (err) {
    console.error("❌ Error cleaning old messages (NY time):", err);
  }
};
