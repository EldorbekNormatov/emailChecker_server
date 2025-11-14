import AdminPassword from "../models/adminPassword.model.js";


// 🔹 Mavjud admin passwordni update qilish
export const updateAdminPassword = async (req, res) => {
    try {
        const { id, adminPassword } = req.body; // client-dan keladi

        if (!id || !adminPassword) {
            return res.status(400).json({ ok: false, msg: "ID yoki password yetarli emas" });
        }

        // faqat passwordni yangilaymiz
        const updated = await AdminPassword.findByIdAndUpdate(
            id,
            { $set: { passwordHash: adminPassword } },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ ok: false, msg: "AdminPassword topilmadi" });
        }

        // serverdan haqiqiy yangilangan documentni qaytaramiz
        return res.status(200).json({ ok: true, adminPassword: updated });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, msg: "Server error" });
    }
};



// 🔹 Barcha admin passwordlarni olish
export const getAdminPasswords = async (req, res) => {
    try {
        const allAdminPasswords = await AdminPassword.find().sort({ createdAt: -1 });
        return res.status(200).json({ ok: true, adminPasswords: allAdminPasswords });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, msg: "Server error" });
    }
};
