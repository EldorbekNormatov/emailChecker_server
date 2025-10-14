// models/Setting.js
import mongoose from "mongoose";

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true, // har bir sozlama faqat bir marta saqlansin
  },
  value: {
    type: String,
    required: true, // bu yerda ISO vaqt string saqlanadi
  },
}, { timestamps: true }); // createdAt va updatedAt qo'shiladi

export const Setting = mongoose.model("Setting", settingSchema);
export default Setting;