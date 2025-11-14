import Password from "../models/password.model.js";

// 🔹 Get password
export const getPassword = async (req, res) => {
    try {
        const passwordsFromDB = await Password.find().sort({ _id: -1 }).limit(1);

        // ObjectId ni string qilish
        const passwords = passwordsFromDB.map(p => ({
            _id: p._id.toString(),
            passwordHash: p.passwordHash
        }));
        res.json({ ok: true, passwords });
    } catch (err) {
        res.json({ ok: false, message: err.message });
    }
}

// 🔹 Create password
export const createPassword = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) return res.json({ ok: false, message: "Password missing" });

        const newPassword = new Password({ passwordHash: password });
        await newPassword.save();

        res.json({ ok: true, password: { _id: newPassword._id.toString(), passwordHash: newPassword.passwordHash } });
    } catch (err) {
        res.json({ ok: false, message: err.message });
    }
}

// 🔹 Update password
export const passwordUpdate = async (req, res) => {
    const { id, userPassword } = req.body;
    const updatedPassword = await Password.findByIdAndUpdate(
        id,
        { $set: { passwordHash: userPassword } },
        { new: true }
    );
    res.status(200).json({ ok: true, password: { id: updatedPassword._id } });
};

// 🔹 Delete password
export const deletePassword = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.json({ ok: false, message: "ID missing" });

        const deleted = await Password.findByIdAndDelete(id);
        if (!deleted) return res.json({ ok: false, message: "Password not found" });

        res.json({ ok: true, deletedId: id });
    } catch (err) {
        res.json({ ok: false, message: err.message });
    }
}

