import fs from "fs";
import path from "path";

const filePath = path.resolve("keywords.json");

// 🔹 Fayl mavjud bo‘lmasa — yaratadi
function ensureFileExists() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
}

// 🔹 Faylni o‘qish
export function readKeywords() {
  try {
    ensureFileExists();
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Keyword read error:", err);
    return [];
  }
}

// 🔹 Faylni yozish
export function saveKeywords(keywords) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(keywords, null, 2));
  } catch (err) {
    console.error("❌ Keyword save error:", err);
  }
}
