import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    deviceId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, required: true }, // admin / user
    isAdmin: { type: Boolean, default: false }, // super admin flag
    adminLabel: { type: String, default: null }, // "super admin" kalit so'zi
    phoneExt: { type: String, default: null },
    phoneNumber: String,
    emailAddress: String,
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
