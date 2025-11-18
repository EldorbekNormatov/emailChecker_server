import express from "express";
import cors from "cors";
import "dotenv/config";
import { updateCache, startCacheUpdater } from "./src/services/cacheService.js";
import routers from "./src/routers/index.js";
import { connectDB } from "./src/database/db.js";
import dotenv from "dotenv";
import { startIgnoreCleaner } from "./src/utils/ignoreCleaner.js";
import { gmail } from "./src/config/gmail.js";
import cron from "node-cron";
import { cleanupOldMessagesNY } from "./src/utils/cleaneMessageCount.js";

dotenv.config();

const app = express();

// ✅ Allowed web origins (you can add more if needed)
const allowedOrigins = [
  "https://emailchecker.nvmailer.uz",
  "http://emailchecker.nvmailer.uz",
  "https://www.emailchecker.nvmailer.uz",
  "http://localhost:3012",
  "https://one.dat.com",
  "https://scm.jbhunt.com",
  "https://freightpower.schneider.com", // ✅ Add Schneider FreightPower
];

// ✅ Universal CORS configuration (includes Chrome extensions)
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (curl, Postman, etc.)
//       if (!origin) return callback(null, true);

//       const normalizedOrigin = origin.toLowerCase();

//       // Allow all Chrome extensions
//       if (normalizedOrigin.startsWith("chrome-extension://")) {
//         return callback(null, true);
//       }

//       // Allow specific domains
//       if (allowedOrigins.includes(normalizedOrigin)) {
//         return callback(null, true);
//       }

//       console.log("❌ CORS blocked origin:", origin);
//       return callback(new Error("CORS policy: origin not allowed"));
//     },
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (curl, Postman, mobile apps)
      if (!origin) return callback(null, true);

      // 🔥 normalize domain (yangi qo‘shildi)
      const normalizedOrigin = origin.toLowerCase();

      // Allow Chrome extensions
      if (normalizedOrigin.startsWith("chrome-extension://")) {
        return callback(null, true);
      }

      // Allow only known domains (lowercase bilan solishtiramiz)
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn("❌ CORS blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
    },

    // 🔥 PUT, DELETE, OPTIONS qo‘shildi
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    // OLDIN BO‘LGANI O‘ZGARMADI
    allowedHeaders: ["Content-Type", "Authorization"],

    // 🔥 cookie/session/token ishlashi uchun
    credentials: true,
  })
);

// 🔹 Server ishga tushganda bir marta eski xabarlarni tozalash
cleanupOldMessagesNY();

// 🔹 Cron bilan har kuni NY vaqti bilan soat 00:05 da avtomatik ishlash
cron.schedule("5 0 * * *", () => {
  cleanupOldMessagesNY();
}, {
  scheduled: true,
  timezone: "America/New_York"
});


app.use(express.json());

// .env dan port olish
const PORT = process.env.PORT || 3012;

// 🔗 Routerlarni ulash
app.use(routers);

// 🧠 MongoDB ulanish
connectDB();

// 🧹 Eski ignoredThreads ni tozalash (24 soatdan eski)
startIgnoreCleaner();

// 🔁 Dastlabki cache yangilash va keyin har 90 soniyada yangilash
updateCache();
startCacheUpdater();

// 🚀 Serverni ishga tushirish
app.listen(PORT, () => console.log(`✅ Server ${PORT} portda ishga tushdi`));