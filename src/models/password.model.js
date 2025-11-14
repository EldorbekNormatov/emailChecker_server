import { Schema, model } from "mongoose";


export const passwordSchema = new Schema({
    passwordHash: {
        type: String,
        required: true,
    },
}, { timestamps: true });

export const Password = model("Password", passwordSchema);
export default Password;