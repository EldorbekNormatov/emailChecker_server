import Keyword from "../models/keyword.model.js";


// 🔵 GET /keywords
export const getKeywords = async (req, res) => {
  try {
    let keywords = await Keyword.findOne();

    // Agar hali yaratilmagan bo‘lsa — bo‘sh massiv bilan yaratamiz
    if (!keywords) {
      keywords = await Keyword.create({ words: [] });
    }

    res.json(keywords.words);
  } catch (err) {
    console.error("❌ Keywordlarni olishda xatolik:", err);
    res.status(500).json({ ok: false, message: "Server xatolik" });
  }
};

// 🟢 POST /add-keyword
export const addKeyword = async (req, res) => {
  try {
    const { word } = req.body;
    if (!word) return res.status(400).json({ ok: false, message: "So'z kiritilmadi" });

    let keywords = await Keyword.findOne();
    if (!keywords) {
      keywords = await Keyword.create({ words: [word] });
    } else {
      if (!keywords.words.includes(word)) {
        keywords.words.push(word);
        await keywords.save();
      }
    }

    res.json(keywords.words);
  } catch (err) {
    console.error("❌ Keyword qo‘shishda xatolik:", err);
    res.status(500).json({ ok: false, message: "Server xatolik" });
  }
};

// 🔴 POST /remove-keyword
export const removeKeyword = async (req, res) => {
  try {
    const { word } = req.body;
    if (!word) return res.status(400).json({ ok: false, message: "So'z kiritilmadi" });

    const keywords = await Keyword.findOne();
    if (!keywords) {
      return res.status(404).json({ ok: false, message: "Keywordlar topilmadi" });
    }

    keywords.words = keywords.words.filter(k => k !== word);
    await keywords.save();

    res.json(keywords.words);
  } catch (err) {
    console.error("❌ Keyword o‘chirishda xatolik:", err);
    res.status(500).json({ ok: false, message: "Server xatolik" });
  }
};
