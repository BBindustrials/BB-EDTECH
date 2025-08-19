// backend/controllers/ttsScript.controller.js
import axios from "axios"

const AI_MODEL = "deepseek/deepseek-r1"

export const generateTTS = async (req, res) => {
  const { question, level } = req.body

  if (!question) {
    return res.status(400).json({ error: "Missing question input." })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: "OpenRouter API key missing." })
  }

  // 🧠 Prompt: Rewrite for spoken TTS
  const prompt = `
You are a math tutor preparing content for voice-over (text-to-speech).

A ${level?.toLowerCase() || 'beginner'} student asked:

"${question}"

Generate a clear spoken script that explains the solution **step by step**, converting all math symbols and formulas into **spoken English**.

- Avoid math notation like superscripts, subscripts, square roots, symbols.
- Example: "x²" → "x squared", "√x" → "square root of x", "π" → "pi"
- Keep it natural, friendly, and easy to understand.
- Do not number the steps or use JSON. Just write plain, readable voice-over text.

Respond with only the spoken script.
`.trim()

  try {
    console.log("🔊 Generating spoken script for TTS...")

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.6
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3001", // ⚠️ Update this in production
          "X-Title": "BB Edtech TTS Script Generator"
        },
        timeout: 40000
      }
    )

    const spokenScript = response?.data?.choices?.[0]?.message?.content?.trim()
    if (!spokenScript) throw new Error("No TTS response received")

    console.log("✅ Spoken script generated.")
    return res.status(200).json({ spokenScript })

  } catch (err) {
    console.error("❌ TTS generation failed:", err.message)
    if (err.response?.data) {
      console.error("🔻 API Error:", err.response.status, err.response.data)
    }
    return res.status(500).json({
      error: "Failed to generate spoken script",
      debug: err.message
    })
  }
}
