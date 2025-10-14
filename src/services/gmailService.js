// services/gmailService.js
import { gmail } from "../config/gmail.js";
import { parseFrom, waitForRetry } from "../utils/helpers.js";
import { CacheMessage } from "../models/CacheMessage.js";
import { Setting } from "../models/Setting.model.js"; // Oxirgi tekshirilgan vaqtni saqlash uchun

export async function fetchReadUnrepliedMessages(keywords, daysRange, ignoredThreads = []) {
  // 🔹 Oxirgi tekshirilgan vaqtni olish
  const lastCheckedSetting = await Setting.findOne({ key: "lastChecked" });
  let after;

  if (lastCheckedSetting) {
    // Keyingi ishga tushganda faqat oxirgi tekshiruvdan keyin kelganlar
    after = Math.floor(new Date(lastCheckedSetting.value).getTime() / 1000);
  } else {
    // Birinchi ishga tushganda foydalanuvchi belgilagan daysRange
    after = Math.floor((Date.now() - daysRange * 24 * 60 * 60 * 1000) / 1000);
  }

  let allMessages = [];
  let pageToken = null;
  const ignoredIds = ignoredThreads.map(t => typeof t === "string" ? t : t.threadId);

  do {
    try {
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

          // 🔹 Threadni tekshirish — javob yozilganmi
          const threadDetail = await gmail.users.threads.get({
            userId: "me",
            id: threadId,
            format: "minimal",
          });

          const hasSentMessage = threadDetail.data.messages.some(m =>
            (m.labelIds || []).includes("SENT")
          );
          if (hasSentMessage) continue;

          // 🔹 Keyword tekshirish
          const hasKeyword = keywords.some(kw =>
            snippet.toLowerCase().includes(kw.toLowerCase())
          );
          if (!hasKeyword) continue;

          // 🔹 Ignored xabarlarni chiqarish
          if (ignoredIds.includes(threadId)) continue;

          // 🔹 Faqat yangi xabarlarni qo‘shish
          const exists = await CacheMessage.findOne({ threadId });
          if (!exists) {
            allMessages.push({
              name: parsed.name,
              email: parsed.email,
              subject,
              date: dateHeader,
              snippet,
              threadId,
              messageId: msg.id,
            });

            await CacheMessage.create({
              name: parsed.name,
              email: parsed.email,
              subject,
              date: dateHeader,
              snippet,
              threadId,
              messageId: msg.id,
            });

            console.log(` Yangi xabar saqlandi: ${parsed.email} (${subject})`);
          }

        } catch (e) {
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

  // 🔹 Oxirgi tekshirilgan vaqtni yangilash
  await Setting.updateOne(
    { key: "lastChecked" },
    { value: new Date().toISOString() },
    { upsert: true }
  );

  console.log(`📩 ${allMessages.length} ta javobsiz xabar topildi. ${new Date()}`);
  return allMessages;
}
