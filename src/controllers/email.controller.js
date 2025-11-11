import User from "../models/user.model.js";
import IgnoreThread from "../models/ignoredThread.model.js";
import CacheMessage from "../models/CacheMessage.js";

export const serverTest = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: "Server ishlayapti" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const emailCache = async (req, res) => {
    try {
        // MongoDB'dan barcha saqlangan javobsiz xabarlarni olamiz
        const messages = await CacheMessage.find().sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error) {
        console.error("❌ emailCache xatolik:", error.message);
        res.status(500).json({
            success: false,
            message: "Server xatosi: " + error.message
        });
    }
};

//  Emailni ignor qilish
export const ignoreEmail = async (req, res) => {
    try {
        const { threadId, deviceId, firstName, lastName, role, name, subject, date } = req.body;

        if (!threadId || !deviceId) {
            return res.status(400).json({ ok: false, error: "threadId yoki deviceId yo'q" });
        }

        // 🔹 1. Avvaldan mavjud emasligini tekshiramiz
        const existing = await IgnoreThread.findOne({ threadId, deviceId });
        if (existing) {
            return res.status(200).json({ ok: true, message: "Bu email allaqachon ignor qilingan" });
        }

        // 🔹 2. Yangi ignor yozuvini saqlaymiz
        await IgnoreThread.create({
            threadId,
            deviceId,
            firstName,
            lastName,
            role,
            name,
            subject,
            date,
        });

        // 🔹 3. CacheMessage’dan ham shu xabarni o‘chirib tashlaymiz
        const deleted = await CacheMessage.deleteOne({ threadId });

        res.json({
            ok: true,
            message: deleted.deletedCount
                ? "Ignor qo‘shildi va CacheMessage’dan o‘chirildi"
                : "Ignor qo‘shildi (cache topilmadi)",
        });
    } catch (error) {
        console.error("❌ ignoreEmail xatolik:", error.message);
        res.status(500).json({ ok: false, error: error.message });
    }
};

//  Faqat shu deviceId uchun ignor qilingan email’larni olish
export const ignoredEmails = async (req, res) => {
    try {
        const { deviceId } = req.body;
        if (!deviceId) return res.status(400).json({ ok: false, error: "deviceId yo'q" });

        const emails = await IgnoreThread.find({ deviceId });
        res.json(emails);
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

// Emailni tiklash (ignor’dan qaytarish)
export const restoreEmail = async (req, res) => {
    try {
        const { threadId, deviceId } = req.body;
        if (!threadId || !deviceId) {
            return res.status(400).json({ ok: false, error: "threadId yoki deviceId yo'q" });
        }

        // 🔹 DBdan topamiz
        const ignored = await IgnoreThread.findOne({ threadId, deviceId });
        if (!ignored) {
            return res.status(404).json({ ok: false, error: "Email topilmadi" });
        }

        // 🔹 Ignore DBdan o‘chiramiz
        await IgnoreThread.deleteOne({ _id: ignored._id });

        // 🔹 Qayta CacheMessage ga qo‘shish (agar kerak bo‘lsa)
        // Agar xabar ilgari CacheMessage’dan o‘chirib tashlangan bo‘lsa,
        // uni qayta qo‘shish mumkin:
        const existsInCache = await CacheMessage.findOne({ threadId });
        if (!existsInCache) {
            await CacheMessage.create({
                threadId: ignored.threadId,
                name: ignored.name || "No name",
                email: ignored.email || "",          // agar email saqlangan bo‘lsa
                subject: ignored.subject || "",
                snippet: ignored.snippet || ignored.subject || "",
                date: ignored.date || new Date().toISOString(),
                messageId: ignored.messageId || "",
            });
        }

        res.json({ ok: true, message: "Email restore qilindi va CacheMessage ga qayta qo‘shildi" });
    } catch (error) {
        console.error("Restore error:", error);
        res.status(500).json({ ok: false, error: error.message });
    }
};


// Barcha ignore qilingan email’larni olish (popup uchun)
export const getAllIgnoredEmails = async (req, res) => {
    try {
        const all = await IgnoreThread.find().sort({ ignoredAt: -1 });
        res.json(all);
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
};

export const userRegister = async (req, res) => {
  try {
    const {
      deviceId,
      firstName,
      lastName,
      role,
      ua,
      platform,
      language,
      screenRes,
      memory,
      cores,
      ip,
      city,
      region,
      country,
    } = req.body;

    // deviceId endi majburiy (IP ishonchli emasligi sabab)
    if (!deviceId || !firstName || !lastName || !role) {
      return res.status(400).json({ ok: false, msg: "Missing fields" });
    }

    // 🔍 deviceId bo‘yicha foydalanuvchini qidiramiz (IP o'rniga)
    let user = await User.findOne({ deviceId });

    if (user) {
      // 🟢 deviceId topilgan bo‘lsa — o‘sha userni yangilaymiz
      user.deviceId = deviceId || user.deviceId;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.role = role || user.role;
      user.ua = ua || user.ua;
      user.platform = platform || user.platform;
      user.language = language || user.language;
      user.screenRes = screenRes || user.screenRes;
      user.memory = memory || user.memory;
      user.cores = cores || user.cores;
      user.ip = ip || user.ip;               // IP optional yangilanadi
      user.city = city || user.city;
      user.region = region || user.region;
      user.country = country || user.country;
      user.lastLogin = new Date();

      await user.save();
    } else {
      // 🔵 deviceId topilmasa — yangi user yaratamiz
      user = await User.create({
        deviceId,
        firstName,
        lastName,
        role,
        ua,
        platform,
        language,
        screenRes,
        memory,
        cores,
        ip,
        city,
        region,
        country,
        lastLogin: new Date(),
      });
    }

    res.json({ ok: true, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ ok: false, msg: "Server error" });
  }
};


export const getUsers = async (req, res) => {
    try {

        const users = await User.find().select("-__v").lean();
        res.json({ ok: true, users });
    } catch (error) {
        res.status(500).json({ ok: false, msg: "Server error" });
    }
}
