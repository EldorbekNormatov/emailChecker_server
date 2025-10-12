import { gmail } from "../config/gmail.js";
import { parseFrom, waitForRetry } from "../utils/helpers.js";

export async function fetchReadUnrepliedMessages(keywords, daysRange, ignoredThreads = []) {
  const after = Math.floor((Date.now() - daysRange * 24 * 60 * 60 * 1000) / 1000);
  let allMessages = [];
  let pageToken = null;

  // Ignore ro‘yxatini stringga o‘tkazamiz
  const ignoredIds = ignoredThreads.map(t => typeof t === "string" ? t : t.threadId);

  do {
    try {
      // ✅ Gmail query: o‘qilgan, yuborilmagan, sanadan keyingi
      const listRes = await gmail.users.messages.list({
        userId: "me",
        q: `is:read -in:sent after:${after}`,
        maxResults: 100,
        pageToken,
      });

      const messages = listRes.data.messages || [];
      pageToken = listRes.data.nextPageToken || null;

      for (const msg of messages) {
        try {
          // 📨 Xabar tafsilotlarini olish
          const detail = await gmail.users.messages.get({
            userId: "me",
            id: msg.id,
            format: "metadata",
            metadataHeaders: ["From", "Subject", "Date"],
          });

          const headers = detail.data.payload.headers || [];
          const fromHeader = headers.find(h => h.name === "From")?.value || "";
          const subject = headers.find(h => h.name === "Subject")?.value || "(Mavzu yo‘q)";
          const dateHeader = headers.find(h => h.name === "Date")?.value || "";
          const snippet = detail.data.snippet || "";
          const parsed = parseFrom(fromHeader);
          const threadId = detail.data.threadId || msg.threadId;

          // 🔥 Thread tafsilotlarini tekshirish (javob yozilganmi?)
          const threadDetail = await gmail.users.threads.get({
            userId: "me",
            id: threadId,
            format: "minimal",
          });

          const hasSentMessage = threadDetail.data.messages.some(m =>
            (m.labelIds || []).includes("SENT")
          );

          if (hasSentMessage) continue; // ✅ Javob yozilgan threadlarni tashlab ketamiz

          // ✅ Kalit so‘zlarni tekshirish
          const hasKeyword = keywords.some(kw =>
            subject.toLowerCase().includes(kw.toLowerCase()) ||
            snippet.toLowerCase().includes(kw.toLowerCase())
          );
          if (!hasKeyword) continue;

          // ✅ Ignore qilingan threadlarni o‘tkazib yuboramiz
          if (ignoredIds.includes(threadId)) continue;

          // ✅ Faqat “javob yozilmagan” xabarni qo‘shamiz
          allMessages.push({
            name: parsed.name,
            email: parsed.email,
            subject,
            date: dateHeader,
            snippet,
            threadId,
            messageId: msg.id,
          });
        } catch (e) {
          // ⚠️ Rate limit yoki boshqa xatolik
          if (e.response?.status === 429) {
            const retryAfter = e.response?.headers?.["retry-after"];
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
            console.warn(`⏳ Rate limit. Kutish ${delay}ms...`);
            await waitForRetry(delay);
            continue;
          }
          console.error("Xabarni olishda xatolik:", e.message);
        }
      }
    } catch (e) {
      console.error("List fetch xatolik:", e.message);
      break;
    }
  } while (pageToken);

  console.log(`📩 ${allMessages.length} ta javobsiz xabar topildi (${ignoredIds.length} ta ignor chiqarildi).`);
  return allMessages;
}
