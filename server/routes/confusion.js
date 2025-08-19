// routes/confusionV2.js
import express from "express"
import axios from "axios"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config()

const router = express.Router()

// 🌍 Environment Vars
const { OPENROUTER_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY } = process.env

// 🧠 Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 🔎 Health Check Log
console.log("🔧 ENV:", {
  SUPABASE_URL: SUPABASE_URL ? "✅" : "❌",
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? "✅" : "❌",
  OPENROUTER_API_KEY: OPENROUTER_API_KEY ? "✅" : "❌"
})

router.post("/", async (req, res) => {
  const { concept, areaofstudy, level, country, stateorregion, keywords, created_at } = req.body
  console.log("📥 New confusion request:", { concept, areaofstudy, level, country, stateorregion })

  // 🛡️ Input Check
  if (!concept || !areaofstudy || !level || !country || !stateorregion) {
    return res.status(400).json({ error: "Missing required fields." })
  }

  // 🧠 Prompt Engineering
  const prompt = `
You're a gifted AI educator helping students overcome academic confusion.
Student from ${stateorregion}, ${country} is struggling with:

- 🧠 Concept: ${concept}
- 📚 Area: ${areaofstudy}
- 🎓 Level: ${level}
- 🔍 Keywords: ${Array.isArray(keywords) ? keywords.join(", ") : keywords || "none"}

Respond with:
1. Friendly introduction
2. Analogy (cultural/local if possible)
3. Step-by-step breakdown
4. Summary and encouragement
  `.trim()

  try {
    console.log("🚀 Requesting explanation from OpenRouter...")

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-r1",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3001",
          "X-Title": "BB Edtech Confusion Solver"
        },
        timeout: 45000
      }
    )

    const aiResponse = response?.data?.choices?.[0]?.message?.content
    if (!aiResponse) throw new Error("No AI response content.")

    console.log("✅ AI responded. Excerpt:", aiResponse.slice(0, 120) + "...")

    // 💾 Optional Supabase Save
    /*
    const { data, error } = await supabase
      .from("confusion_solver")
      .update({ ai_response: aiResponse })
      .eq("concept", concept)
      .eq("created_at", created_at)

    if (error) {
      console.warn("⚠️ Supabase update failed:", error.message)
    } else {
      console.log("📝 AI response saved to Supabase.")
    }
    */

    return res.status(200).json({ response: aiResponse, success: true })

  } catch (err) {
    const { message, response: apiErr } = err
    console.error("❌ AI service error:", message)

    if (apiErr) {
      console.error("🔻 OpenRouter Error:", {
        status: apiErr.status,
        data: apiErr.data
      })

      if (apiErr.status === 402) {
        return res.status(402).json({
          error: "OpenRouter: Insufficient credits or usage limits exceeded."
        })
      }
    }

    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "AI service timeout. Try again later." })
    }

    return res.status(500).json({
      error: "Internal server error.",
      debug: process.env.NODE_ENV === "development" ? message : undefined
    })
  }
})

export default router
