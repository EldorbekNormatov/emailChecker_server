import { gmail } from "../config/gmail.js";
import { CacheMessage } from "../models/CacheMessage.js";

// 🔹 Kutish funksiyasi
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

export async function updateCachedMessages() {
  const cached = await CacheMessage.find();
  console.log(`🔍 ${cached.length} ta xabar tekshiriladi...`);

  let checked = 0;
  let deleted = 0;

  for (const msg of cached) {
    try {
      await delay(3000); // 3s kutish

      const thread = await gmail.users.threads.get({
        userId: "me",
        id: msg.threadId,
        format: "minimal"
      });

      const hasSent = thread.data.messages.some(m =>
        (m.labelIds || []).includes("SENT")
      );

      if (hasSent) {
        await CacheMessage.deleteOne({ threadId: msg.threadId });
        deleted++;
        console.log(`🗑️ Javob berilgan: ${msg.email} (${msg.subject})`);
      }

      checked++;
    } catch (err) {
      if (err.response?.status === 429) {
        console.warn("⚠️ Rate limit. 5s kutish va qayta urinish...");
        await delay(5000);
        continue;
      }
      console.warn("❌ Thread tekshirishda xatolik:", err.message);
    }
  }

  console.log(`✅ Tekshiruv tugadi. ${checked} ta ko‘rildi, ${deleted} ta o‘chirildi.`);
}
