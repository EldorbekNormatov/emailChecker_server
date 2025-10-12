import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB ulanish muvaffaqiyatli!");
  } catch (error) {
    console.error("❌ MongoDB ulanishda xatolik:", error.message);
    process.exit(1); // serverni to‘xtatadi
  }
}
