import express from "express";
import { addKeyword, getKeywords, removeKeyword } from "../controllers/keyword.controller.js";

const router = express.Router();

router.get("/keywords", getKeywords);
router.post("/add-keyword", addKeyword);
router.post("/remove-keyword", removeKeyword);

export default router;