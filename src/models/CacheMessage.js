import mongoose from "mongoose";

const cacheMessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  date: String,
  snippet: String,
  threadId: String,
  messageId: String,
}, { timestamps: true });

export const CacheMessage = mongoose.model("CacheMessage", cacheMessageSchema);
export default CacheMessage;