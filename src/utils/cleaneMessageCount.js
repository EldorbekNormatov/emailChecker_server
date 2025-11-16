import MessageSendCount from "../models/messageSendCount.model.js";


export const cleanupOldMessagesNY = async () => {
  try {
    const now = new Date();

    // New York vaqt zonasi offset (EST = UTC-5, EDT = UTC-4)
    // Agar DST (daylight saving) ishlatishni xohlasang, kutubxona kerak bo'ladi
    const offsetHours = -5; // oddiy EST offset, kerak bo‘lsa +1 DST qo‘shish mumkin
    const nyNow = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);

    // Bugun boshlanishi NY vaqti bilan
    const todayStart = new Date(nyNow);
    todayStart.setUTCHours(0, 0, 0, 0);

    // Kecha boshlanishi NY vaqti bilan
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setUTCDate(todayStart.getUTCDate() - 1);

    // Faqat bugun va kecha xabarlarini saqlaymiz
    const result = await MessageSendCount.deleteMany({
      sentAt: { $lt: yesterdayStart } // kechadan oldingi xabarlar o‘chadi
    });

    console.log(`🗑️ Deleted ${result.deletedCount} old messages (NY time)`);
  } catch (err) {
    console.error("❌ Error cleaning old messages (NY time):", err);
  }
};
