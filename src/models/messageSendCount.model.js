import { Schema, model } from "mongoose";

export const messageSendCountSchema = new Schema({
  userId: {           // foydalanuvchining MongoDB _id si
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  deviceId: {
    type: String,
    required: true
  },
  count: {           // har bir record uchun default 1
    type: Number,
    default: 1
  },
  sentAt: {          // xabar yuborilgan vaqt
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export const MessageSendCount = model("MessageSendCount", messageSendCountSchema);
export default MessageSendCount;
