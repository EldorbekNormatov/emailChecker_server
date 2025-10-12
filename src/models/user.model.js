import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    deviceId: { type: String, unique: true },
    firstName: String,
    lastName: String,
    role: String,
    ua: String,
    platform: String,
    language: String,
    screenRes: String,
    memory: String,
    cores: String,

    ip: String,
    city: String,
    region: String,
    country: String,
    lastLogin: Date,
  },
  { timestamps: true }
);

const User = model("User", UserSchema);
export default User;
