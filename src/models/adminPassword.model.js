import { Schema, model } from "mongoose";

const AdminPasswordSchema = new Schema(
    {
        passwordHash: { type: String, required: true }, // bcrypt hash
        label: { type: String, default: "super admin" }, // frontga yuborish uchun
    },
    { timestamps: true }
);

const AdminPassword = model("AdminPassword", AdminPasswordSchema);
export default AdminPassword;
