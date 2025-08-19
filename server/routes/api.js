// routes/api.js
import express from "express"
import { generateTTS } from "../controllers/ttsScript.controller.js"

const router = express.Router()

router.post("/tts-script", generateTTS)

export default router
