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
    "chrome-extension://jomahiepnpigcohagehflhcikcinnidf", // Chrome extension ID
    "https://emailchecker.nvmailer.uz",                   // Deployed domain
    "http://localhost:3012"                                // Local testing
  ];
  
  app.use(cors({
    origin: function(origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy: origin not allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
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
