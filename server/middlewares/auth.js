// middleware/auth.js
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

// ⚡ Supabase client (anon key only for verifying JWTs)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" })
    }

    const token = authHeader.split(" ")[1]

    // ✅ Verify token
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      console.error("❌ Token verification failed:", error?.message)
      return res.status(401).json({ error: "Unauthorized" })
    }

    // 🎯 Attach user to request
    req.user = data.user
    next()
  } catch (err) {
    console.error("🔥 Auth middleware error:", err)
    res.status(500).json({ error: "Internal Server Error" })
  }
}
