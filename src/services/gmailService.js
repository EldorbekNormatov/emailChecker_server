import { gmail } from "../config/gmail.js";
import { parseFrom, waitForRetry } from "../utils/helpers.js";
import { CacheMessage } from "../models/CacheMessage.js";
import { Setting } from "../models/Setting.model.js";

// 🔹 Har bir so‘rov orasida kutish (delay bilan)
async function limitedFetch(fn, delay = 3000) { // 3s kutish bilan sorov yubroadi
  await new Promise(r => setTimeout(r, delay));
  return fn();
}

export async function fetchReadUnrepliedMessages(keywords, daysRange, ignoredThreads = []) {
  const lastCheckedSetting = await Setting.findOne({ key: "lastChecked" });
  const after = lastCheckedSetting
    ? Math.floor(new Date(lastCheckedSetting.value).getTime() / 1000)
    : Math.floor((Date.now() - daysRange * 24 * 60 * 60 * 1000) / 1000);

  const ignoredIds = ignoredThreads.map(t => (typeof t === "string" ? t : t.threadId));
  let allMessages = [];
  let pageToken = null;
  let pageCount = 0;

  console.log("🔍 Gmail’dan javob yozilmagan xabarlar olinmoqda... (Optimized polling)");

  do {
    if (pageCount >= 2) break; // xavfsiz limit: 100 threaddan oshmaydi
    pageCount++;

    try {
      const listRes = await limitedFetch(() =>
        gmail.users.threads.list({
          userId: "me",
          q: `is:read -in:sent after:${after}`,
          maxResults: 50,
          pageToken,
        })
      );

      const threads = listRes.data.threads || [];
      pageToken = listRes.data.nextPageToken || null;

      for (const thread of threads) {
        if (ignoredIds.includes(thread.id)) continue;

        try {
          const threadDetail = await limitedFetch(() =>
            gmail.users.threads.get({
              userId: "me",
              id: thread.id,
              format: "full",
            })
          );

          const hasSent = threadDetail.data.messages.some(m =>
            (m.labelIds || []).includes("SENT")
          );
          if (hasSent) continue;

          const lastMessage = threadDetail.data.messages.at(-1);
          const headers = lastMessage.payload.headers || [];

          const fromHeader = headers.find(h => h.name === "From")?.value || "";
          const subject = headers.find(h => h.name === "Subject")?.value || "(Mavzu yo‘q)";
          const dateHeader = headers.find(h => h.name === "Date")?.value || "";
          const parsed = parseFrom(fromHeader);

          let bodyData = "";
          function extractBody(part) {
            if (part.parts) {
              for (const p of part.parts) extractBody(p);
            } else if (part.body?.data) {
              const decoded = Buffer.from(part.body.data, "base64").toString("utf-8");
              bodyData += decoded;
            }
          }
          extractBody(lastMessage.payload);

          const cleanBody = bodyData.replace(/<[^>]*>?/gm, "").toLowerCase();
          const hasKeyword = keywords.some(kw => cleanBody.includes(kw.toLowerCase()));
          if (!hasKeyword) continue;

          const exists = await CacheMessage.findOne({ threadId: thread.id });
          if (!exists) {
            const newMsg = {
              name: parsed.name,
              email: parsed.email,
              subject,
              date: dateHeader,
              snippet: cleanBody.slice(0, 250) + "...",
              threadId: thread.id,
              messageId: lastMessage.id,
            };
            await CacheMessage.create(newMsg);
            allMessages.push(newMsg);
            console.log(`📩 Yangi xabar saqlandi: ${parsed.email} (${subject})`);
          }

        } catch (e) {
          if (e.response?.status === 429) {
            console.warn("⏳ Rate limit. 5s kutish va davom etish...");
            await waitForRetry(10000);
            continue;
          }
          console.error("Threadni olishda xatolik:", e.message);
        }
      }

    } catch (err) {
      console.error("Thread list olishda xatolik:", err.message);
      break;
    }
  } while (pageToken);

  await Setting.updateOne(
    { key: "lastChecked" },
    { value: new Date().toISOString() },
    { upsert: true }
  );

  console.log(`✅ ${allMessages.length} ta javobsiz xabar topildi. ${new Date()}`);
  return allMessages;
}
