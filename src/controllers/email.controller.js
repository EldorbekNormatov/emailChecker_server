import User from "../models/user.model.js";
import IgnoreThread from "../models/ignoredThread.model.js";
import CacheMessage from "../models/CacheMessage.js";
import AdminPassword from "../models/adminPassword.model.js";
import Password from "../models/password.model.js";
import MessageSendCount from "../models/messageSendCount.model.js";

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
            password,
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


        // 1️⃣ Minimal required tekshiruv
        if (!firstName || !lastName || !password) {
            return res.status(400).json({ ok: false, msg: "firstName, lastName va password talab qilinadi" });
        }

        // 2️⃣ Ism va familiya takrorlanishini tekshirish
        const existingUser = await User.findOne({ firstName, lastName });
        if (existingUser) {
            return res.status(400).json({ ok: false, msg: "Bu ism va familiya allaqachon mavjud" });
        }

        let isAdmin = false;
        let adminLabel = null;

        // 3️⃣ Admin password tekshirish
        const adminPassDoc = await AdminPassword.findOne({}); // Hozircha bitta hujjat deb hisoblaymiz


        if (adminPassDoc && String(password) === String(adminPassDoc.passwordHash)) {
            console.log("Admin password document:", password);
            isAdmin = true;
            adminLabel = adminPassDoc.label || "super admin";
        } else {
            const validPassword = await Password.findOne({ passwordHash: password });
            if (!validPassword) {
                return res.status(400).json({ ok: false, msg: "Noto‘g‘ri parol" });
            }
        }



        // 5️⃣ Yangi user yaratish
        const user = await User.create({
            deviceId,
            firstName,
            lastName,
            role,
            isAdmin,
            adminLabel,
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

        // 6️⃣ Javob
        return res.json({
            ok: true,
            user: {
                deviceId: user.deviceId,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isAdmin,
                adminLabel,
            },
        });

    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ ok: false, msg: "Server error" });
    }
};


export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-__v").lean();

        // Amerika vaqt zonasi uchun offset (masalan, EST UTC-5)
        const offsetHours = -5; // EST
        const now = new Date();

        // Amerika vaqti bilan bugun boshlanishi
        const estNow = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);

        const todayStart = new Date(estNow);
        todayStart.setHours(0, 0, 0, 0); // EST bo'yicha bugun boshlanishi

        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayStart.getDate() + 1); // EST bo'yicha bugun oxiri

        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(todayStart.getDate() - 1); // EST bo'yicha kecha boshlanishi

        // Har bir user uchun hisoblash
        const usersWithCounts = await Promise.all(users.map(async (user) => {
            const todayCount = await MessageSendCount.countDocuments({
                deviceId: user.deviceId,
                sentAt: { $gte: todayStart, $lt: todayEnd }
            });

            const yesterdayCount = await MessageSendCount.countDocuments({
                deviceId: user.deviceId,
                sentAt: { $gte: yesterdayStart, $lt: todayStart }
            });

            return {
                ...user,
                messageStats: {
                    today: todayCount,
                    yesterday: yesterdayCount
                }
            };
        }));

        res.json({ ok: true, users: usersWithCounts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: "Server error" });
    }
};


export const notifyDevice = async (req, res) => {
    try {
        const { deviceId } = req.body;

        console.log(deviceId)

        if (!deviceId) {
            return res.status(400).json({ ok: false, msg: "deviceId is required" });
        }

        const user = await User.findOne({ deviceId });
        if (!user) {
            return res.status(404).json({ ok: false, msg: "User not found" });
        }

        // Har safar yangi record yaratamiz
        await MessageSendCount.create({
            userId: user._id,
            deviceId,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            count: 1,
            sentAt: new Date()
        });

        return res.status(200).json({ ok: true, msg: "Message delivery information has been recorded!" });

    } catch (err) {
        console.error("Notify error:", err);
        return res.status(500).json({ ok: false, msg: "Server error" });
    }
};


