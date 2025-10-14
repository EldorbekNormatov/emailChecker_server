// services/updateCachedMessages.js
import { gmail } from "../config/gmail.js";
import { CacheMessage } from "../models/CacheMessage.js";

export async function updateCachedMessages() {
  const cached = await CacheMessage.find();

  for (const msg of cached) {
    try {
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
        console.log(`🗑️ Javob berilgan xabar o‘chirildi: ${msg.email} (${msg.subject})`);
      }
    } catch (e) {
      console.warn("Thread tekshirishda xatolik:", e.message);
    }
  }
}
