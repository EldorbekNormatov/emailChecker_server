import { Schema, model } from "mongoose";

const IgnoreThreadSchema = new Schema({
  threadId: { type: String, required: true },
  deviceId: { type: String, required: true },
  firstName: String,
  lastName: String,
  role: String,

  name: String, 
  subject: String,
  date: String,

  ignoredAt: { type: Date, default: Date.now }
});

export const IgnoreThread = model("IgnoreThread", IgnoreThreadSchema);
export default IgnoreThread;