// backend/routes/socratic.route.js
import express from "express"
import axios from "axios"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
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

/**
 * @route POST /api/socratic
 * @desc Process multi-turn Socratic dialogue with AI
 */
router.post("/", async (req, res) => {
  const { history, created_at } = req.body

  console.log("📥 Socratic Tutor interaction started.")

  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: "Missing or invalid message history." })
  }

  const conversation = history.map(
    (m) => `${m.sender === "user" ? "Student" : "Tutor"}: ${m.text}`
  ).join("\n")

  const prompt = `
You are a Socratic Tutor – an intelligent AI that teaches by asking powerful questions. 

Engage in thoughtful dialogue:
${conversation}

Now continue the conversation by asking a layered, open-ended question based on the student's last response. 
Use one of the Socratic techniques: Clarification, Assumption Probing, Evidence, Perspectives, Consequences, or Reflection.

Do not give direct answers.
Respond with empathy, curiosity, and intellectual challenge.
  `.trim()

  try {
    console.log("🚀 Requesting Socratic response from OpenRouter...")

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-r1",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3001", // 🔄 Update in production
          "X-Title": "BB Edtech Socratic Tutor"
        },
        timeout: 45000
      }
    )

    const aiReply = response?.data?.choices?.[0]?.message?.content
    if (!aiReply) throw new Error("No AI response content.")

    console.log("✅ AI Socratic reply generated. Preview:", aiReply.slice(0, 100) + "...")

    /*
    const { data, error } = await supabase
      .from("socratic_sessions")
      .insert([{ history, ai_response: aiReply, created_at }])
    */

    return res.status(200).json({ response: aiReply, success: true })

  } catch (err) {
    const { message, response: apiErr } = err
    console.error("❌ AI Socratic service error:", message)

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
