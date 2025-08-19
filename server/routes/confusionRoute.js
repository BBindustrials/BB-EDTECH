// backend/routes/confusionRoute.js
import express from "express"
import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const router = express.Router()

// POST /api/confusion
router.post("/", async (req, res) => {
  try {
    const { confusion, level, subject, keywords } = req.body

    if (!confusion) {
      return res.status(400).json({ error: "Confusion input is required" })
    }

    // 🧠 LLM Prompt
    const prompt = `
You are an AI educator. Your job is to clearly explain the following confusing concept:
- Concept: "${confusion}"
- Level: ${level || "Not specified"}
- Subject: ${subject || "General"}
- Keywords: ${keywords || "None"}

Give the explanation in two formats:
1. A spoken voiceover script (simple, conversational).
2. A slide-friendly script (with headings, bullet points, and structured layout).
    `.trim()

    // 🤖 OpenRouter Request
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful academic assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    )

    const output = response.data.choices?.[0]?.message?.content

    res.status(200).json({ result: output })

  } catch (err) {
    console.error("❌ ConfusionSolver Error:", err)
    res.status(500).json({ error: "AI generation failed" })
  }
})

export default router
