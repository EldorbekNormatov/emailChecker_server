import { gmail } from "../config/gmail.js";
import { parseFrom } from "../utils/helpers.js";
import { CacheMessage } from "../models/CacheMessage.js";
import { Setting } from "../models/Setting.model.js";

async function limitedFetch(fn, delay = 3000) {
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

  console.log("🔍 Gmail’dan javobsiz xabarlar olinmoqda...");

  let newestMessageDate = null; // <-- oxirgi xabar vaqtini to‘plash

  do {
    if (pageCount >= 2) break;
    pageCount++;

    let listRes;

    try {
      listRes = await limitedFetch(() =>
        gmail.users.threads.list({
          userId: "me",
          q: `-in:sent after:${after}`,
          maxResults: 50,
          pageToken,
        })
      );
    } catch (e) {
      // 🔥 Refresh token ishdan chiqqanini aniqlash
      if (e.response?.data?.error === "invalid_grant") {
        console.error("❌ REFRESH TOKEN ISHDAN CHIQDI !");
        console.error("Google OAuth token expired or revoked!");
        throw e; // Istsangiz bu yerda botni to‘xtatish kerak
      }

      console.error("Thread list olishda xatolik:", e.message);
      break;
    }


    const threads = listRes.data.threads || [];
    console.log(threads)
    pageToken = listRes.data.nextPageToken || null;

    for (const thread of threads) {
      if (ignoredIds.includes(thread.id)) continue;

      let threadDetail;

      try {
        threadDetail = await limitedFetch(() =>
          gmail.users.threads.get({
            userId: "me",
            id: thread.id,
            format: "full",
          })
        );
      } catch (e) {
        // 🔥 Refresh token xatosi
        if (e.response?.data?.error === "invalid_grant") {
          console.error("❌ REFRESH TOKEN ISHDAN CHIQDI !");
          console.error("Google OAuth token expired or revoked!");
          throw e; 
        }

        // Rate limit
        if (e.response?.status === 429) {
          console.warn("⏳ Rate limit. 10s kutish va davom etish...");
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }

        console.error("Thread olishda xatolik:", e.message);
        continue;
      }

      const messages = threadDetail.data.messages;
      const lastMessage = messages.at(-1);

      // 🔥 1) Faqat oxirgi xabar SENT bo‘lsa tashlab ketamiz
      const isReplied = (lastMessage.labelIds || []).includes("SENT");
      if (isReplied) continue;

      // 🔥 2) lastChecked vaqtini aniqlash
      const dateHeader = lastMessage.payload.headers.find(h => h.name === "Date")?.value;
      if (dateHeader) {
        const msgDate = new Date(dateHeader).getTime();
        if (!newestMessageDate || msgDate > newestMessageDate) {
          newestMessageDate = msgDate;
        }
      }

      // From, subject headerlari
      const fromHeader = lastMessage.payload.headers.find(h => h.name === "From")?.value || "";
      const subject = lastMessage.payload.headers.find(h => h.name === "Subject")?.value || "(Mavzu yo‘q)";
      const parsed = parseFrom(fromHeader);

      // Body extract
      let bodyData = "";
      function extractBody(part) {
        if (part.parts) {
          part.parts.forEach(extractBody);
        } else if (part.body?.data) {
          bodyData += Buffer.from(part.body.data, "base64").toString("utf-8");
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
    }

  } while (pageToken);

  // 🔥 3) lastChecked = Eng oxirgi xabar vaqti
  if (newestMessageDate) {
    await Setting.updateOne(
      { key: "lastChecked" },
      { value: new Date(newestMessageDate).toISOString() },
      { upsert: true }
    );
  }

  console.log(`✅ ${allMessages.length} ta javobsiz xabar topildi.`);
  return allMessages;
}
