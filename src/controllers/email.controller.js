import { cache } from "../services/cacheService.js";
import User from "../models/user.model.js";
import IgnoreThread from "../models/ignoredThread.model.js";

//Serverni tekshirish uchun
export const serverTest = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: "Server ishlayapti" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const emailCashe = async (req, res) => {
    try {
        res.status(200).json(cache.results);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

//  Emailni ignor qilish
export const ignoreEmail = async (req, res) => {
    try {
        const { threadId, deviceId, firstName, lastName, role, name, subject, date } = req.body;

        if (!threadId || !deviceId) {
            return res.status(400).json({ ok: false, error: "threadId yoki deviceId yo'q" });
        }

        // 🔸 Avvaldan mavjud emasligini tekshirish
        const existing = await IgnoreThread.findOne({ threadId, deviceId });
        if (existing) {
            return res.status(200).json({ ok: true, message: "Bu email allaqachon ignor qilingan" });
        }

        // 🔸 Yangi ignor yozuvini yaratish
        await IgnoreThread.create({
            threadId,
            deviceId,
            firstName,
            lastName,
            role,
            name,
            subject,
            date
        });

        // 🔸 Cache’dan o‘chirish (agar mavjud bo‘lsa)
        if (cache?.results) {
            cache.results = cache.results.filter(e => e.threadId !== threadId);
        }

        res.json({ ok: true });
    } catch (error) {
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
        if (!threadId || !deviceId)
            return res.status(400).json({ ok: false, error: "threadId yoki deviceId yo'q" });

        // DBdan topamiz
        const ignored = await IgnoreThread.findOne({ threadId, deviceId });
        if (!ignored)
            return res.status(404).json({ ok: false, error: "Email topilmadi" });

        // Cache mavjud bo‘lsa, qayta qo‘shamiz (to‘liq strukturada)
        if (cache?.results) {
            cache.results.push({
                threadId: ignored.threadId,
                name: ignored.name || "No name",
                subject: ignored.subject || "",
                snippet: ignored.subject || "", // snippet sifatida subject yoki qisqa mazmun
                date: ignored.date || new Date().toISOString(),
                fromIgnoreRestore: true // debug uchun flag (xohlasa olib tashlasa bo‘ladi)
            });
        }

        // Ignore DBdan o‘chiramiz
        await IgnoreThread.deleteOne({ _id: ignored._id });

        res.json({ ok: true });
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

        if (!ip || !firstName || !lastName || !role) {
            return res.status(400).json({ ok: false, msg: "Missing fields" });
        }

        // 🔍 IP bo‘yicha foydalanuvchini qidiramiz
        let user = await User.findOne({ ip });

        if (user) {
            // 🟢 IP topilgan bo‘lsa — o‘sha userni yangilaymiz (IP o‘zgarmaydi)
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
            user.city = city || user.city;
            user.region = region || user.region;
            user.country = country || user.country;
            user.lastLogin = new Date();

            // ⚠️ IP o‘zgartirilmaydi!
            await user.save();
        } else {
            // 🔵 IP topilmasa — yangi user yaratamiz
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
