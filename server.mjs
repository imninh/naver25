// server.mjs
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

app.post("/api/generateTask", async (req, res) => {
  const { prompt, mood = "neutral" } = req.body;

  const systemPrompt = `
Bạn là một trợ lý học tập thông minh của NAVER. 
Dựa trên input của người dùng, hãy trả về CHỈ JSON dạng mảng các object task suggestion:

[
  {
    "title": "string (tên task ngắn gọn)",
    "description": "string (mô tả chi tiết)",
    "estimatedMinutes": number (thời gian ước tính),
    "priority": "low|medium|high",
    "suggestedSlot": "2025-09-10T20:00:00+07:00" (hoặc null)
  }
]

Yêu cầu:
- Trả về 1-3 task suggestions
- Ưu tiên dựa trên mood: ${mood}
- suggestedSlot nên là khung giờ hợp lý trong 7 ngày tới
- Không viết thêm text ngoài JSON
`;

  try {
    const resp = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\nUser input: " + prompt }]
          }
        ],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 800,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;
    try {
      // Xử lý response để extract JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = null;
      }
    } catch (e) {
      console.error("JSON parse error:", e);
      parsed = null;
    }

    if (!parsed) {
      return res.status(200).json({ error: "parse_failed", raw: text });
    }

    res.json({ suggestions: parsed });
  } catch (err) {
    console.error("Gemini request failed:", err);
    res.status(500).json({ error: "Gemini request failed", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Gemini server running at http://localhost:${PORT}`);
});