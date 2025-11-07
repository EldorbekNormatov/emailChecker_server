import User from "../models/user.model.js";


export const getUserByDeviceId = async (req, res) => {
  try {
    const user = await User.findOne({ deviceId: req.params.deviceId });
    res.json({ ok: true, user });
  } catch {
    res.json({ ok: false, user: null });
  }
};

export const updateUserByDeviceId = async (req, res) => {
  try {
    const updated = await User.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.json({ ok: false });
    res.json({ ok: true, user: updated });
  } catch {
    res.json({ ok: false });
  }
};

export const deleteUserByDeviceId = async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({ deviceId: req.params.deviceId });
    if (!deleted) return res.json({ ok: false });
    res.json({ ok: true, user: deleted });
  } catch {
    res.json({ ok: false });
  }
};
