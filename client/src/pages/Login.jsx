import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "../services/supabaseClient"
import "./Login.css"
import logo from "../assets/BB-EDTECH.png"

const Login = ({ onLogin = () => {} }) => {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // 🔍 Check existing session
    const initSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Session fetch error:", error.message)
        return
      }

      const sessionUser = data?.session?.user
      const token = data?.session?.access_token

      if (sessionUser && token) {
        setUser(sessionUser)
        localStorage.setItem("token", token) // ✅ Persist token for fetch()
        onLogin(sessionUser)
        navigate("/")
      }
    }

    initSession()

    // 🔄 Listen for login/logout events
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user && session?.access_token) {
          setUser(session.user)
          localStorage.setItem("token", session.access_token)
          onLogin(session.user)
          navigate("/")
        } else if (event === "SIGNED_OUT") {
          setUser(null)
          localStorage.removeItem("token")
          navigate("/login")
        }
      }
    )

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [navigate, onLogin])

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" })
    if (error) {
      console.error("❌ Login error:", error.message)
    }
  }

  if (user) return null

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <img src={logo} alt="BB EDTECH Logo" className="login-logo" />
        <h1 className="login-title">BB EDTECH.AI</h1>
        <p className="login-subtitle">
          <i>Your Study-Aid Companion</i>
        </p>

        <button className="login-button" onClick={handleLogin}>
          🔐 Sign in with Google
        </button>
      </div>
    </div>
  )
}

export default Login
