import express from "express";
import cors from "cors";
import 'dotenv/config';
import { updateCache, startCacheUpdater } from "./src/services/cacheService.js";
import routers from "./src/routers/index.js";
import { connectDB } from "./src/database/db.js";
import dotenv from "dotenv";
import { startIgnoreCleaner } from "./src/utils/ignoreCleaner.js";
import { gmail } from "./src/config/gmail.js";
dotenv.config();


const app = express();

const allowedOrigins = [
  "chrome-extension://jomahiepnpigcohagehflhcikcinnidf/", // Chrome extension ID
  "https://emailchecker.nvmailer.uz",                     // Main domain
  "http://emailchecker.nvmailer.uz",                      // Non-HTTPS variant (redirected)
  "https://www.emailchecker.nvmailer.uz",                 // www domain (optional)
  "http://localhost:3012",                                // Local API test
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ CORS blocked origin:", origin);
      callback(new Error("CORS policy: origin not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

// .env dan port olish
const PORT = process.env.PORT || 3012;

// Routerlarni ulash
app.use(routers);
connectDB();


// Eski ignoredThreads ni tozalash (24 soatdan eski)
startIgnoreCleaner();
// Dastlabki cache yangilash va keyin har 90 soniyada yangilash
updateCache();
startCacheUpdater();

app.listen(PORT, () => console.log(`Server ${PORT} portda ishga tushdi`));
