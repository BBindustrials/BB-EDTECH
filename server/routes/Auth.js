// routes/auth.js
import express from "express"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"

dotenv.config()
const router = express.Router()

// ✅ Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // for server-side ops
)

// 🟢 Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" })
    }

    // ✅ Sign in using Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error("❌ Supabase login error:", error)
      return res.status(401).json({ error: error.message })
    }

    // 🎟️ Return the access token to frontend
    return res.json({
      token: data.session.access_token,
      user: data.user
    })
  } catch (err) {
    console.error("🔥 /api/auth/login error:", err)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// 🟣 Signup route
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      console.error("❌ Supabase signup error:", error)
      return res.status(400).json({ error: error.message })
    }

    return res.json({ message: "Signup successful. Check your email to verify.", data })
  } catch (err) {
    console.error("🔥 /api/auth/signup error:", err)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

export default router
