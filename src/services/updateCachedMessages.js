import { gmail } from "../config/gmail.js";
import { CacheMessage } from "../models/CacheMessage.js";

// 🔹 Kutish
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

export async function updateCachedMessages() {
  const cached = await CacheMessage.find();
  console.log(`🔍 ${cached.length} ta xabar tekshiriladi...`);

  let checked = 0;
  let deleted = 0;

  for (const msg of cached) {
    while (true) {
      try {
        // Gmail API rate-limit uchun eng yaxshi format = metadata
        const thread = await gmail.users.threads.get({
          userId: "me",
          id: msg.threadId,
          format: "metadata",
        });

        const messages = thread.data.messages || [];

        // Agar thread bo'sh bo'lsa — uni o'chirish kerak
        if (messages.length === 0) {
          await CacheMessage.deleteOne({ threadId: msg.threadId });
          console.log(`🗑️ Thread mavjud emas → o‘chirildi: ${msg.threadId}`);
          deleted++;
          break;
        }

        // 🔥 Faqat oxirgi xabarni tekshir
        const lastMessage = messages.at(-1);

        const isReplied = (lastMessage.labelIds || []).includes("SENT");

        if (isReplied) {
          await CacheMessage.deleteOne({ threadId: msg.threadId });
          console.log(`🗑️ Javob berilgan → cache-dan o‘chirildi: ${msg.email}`);
          deleted++;
        }

        checked++;
        break; // muvaffaqiyatli bo‘lsa loopdan chiqadi

      } catch (err) {
        if (err.response?.status === 429) {
          console.warn("⚠️ Rate limit! 5s kutish → qayta tekshiraman...");
          await delay(5000);
          continue; // aynan shu threadni qayta tekshiradi
        }

        console.warn("❌ Thread tekshirish xatosi:", err.message);

        // Agar thread o‘chirilgan bo‘lsa yoki topilmasa → cache-dan o‘chiriladi
        if (err.response?.status === 404) {
          await CacheMessage.deleteOne({ threadId: msg.threadId });
          console.log(`🗑️ 404 → Thread topilmadi, o‘chirildi: ${msg.threadId}`);
          deleted++;
        }

        break; // boshqa xatolar uchun skip
      }
    }

    // 🔹 Har bir iteration orasida kichkina delay
    await delay(1500);
  }

  console.log(
    `✅ Tekshiruv tugadi. Ko‘rilgan: ${checked} ta | O‘chirilgan: ${deleted} ta.`
  );
}
