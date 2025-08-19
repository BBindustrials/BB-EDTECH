// server/routes/adaptive.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const router = express.Router();

// 🌍 Environment Vars
const { OPENROUTER_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

// 🧠 Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🔎 Health Check Log
console.log("🔧 ENV:", {
  SUPABASE_URL: SUPABASE_URL ? "✅" : "❌",
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? "✅" : "❌",
  OPENROUTER_API_KEY: OPENROUTER_API_KEY ? "✅" : "❌"
});

// Helper to call OpenRouter AI
const callOpenRouter = async (prompt, temperature = 0.5, max_tokens = 500) => {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "deepseek/deepseek-r1",
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3001",
        "X-Title": "BB Edtech Adaptive Tutor"
      },
      timeout: 40000
    }
  );
  return response?.data?.choices?.[0]?.message?.content?.trim();
};

/**
 * @route POST /api/adaptive/diagnostic
 * @desc Returns a diagnostic question for the selected topic
 */
router.post("/diagnostic", async (req, res) => {
  const { topic } = req.body;

  if (!topic || typeof topic !== "string") {
    return res.status(400).json({ error: "Missing or invalid topic." });
  }

  const prompt = `
You are an Adaptive Tutor.

A student has selected the topic: "${topic}".

Please generate one diagnostic question that can help assess the student's current level of understanding of this topic.

Respond with only the question text.
  `.trim();

  try {
    console.log("🔍 Generating diagnostic question...");
    const question = await callOpenRouter(prompt);

    if (!question) throw new Error("No diagnostic question received.");

    console.log("✅ Diagnostic Question:", question);
    res.status(200).json({ question });
  } catch (err) {
    console.error("❌ Diagnostic generation failed:", err.message);
    res.status(500).json({
      error: "Failed to generate diagnostic question.",
      debug: err.message
    });
  }
});

/**
 * @route POST /api/adaptive/submit-answer
 * @desc Evaluates the student's answer and returns feedback and next content
 */
router.post("/submit-answer", async (req, res) => {
  const { topic, question, answer } = req.body;

  if (!topic || !question || !answer) {
    return res.status(400).json({ error: "Missing topic, question, or answer." });
  }

  const prompt = `
You are an Adaptive Tutor.

The topic is: ${topic}
The diagnostic question was: ${question}
The student's answer: ${answer}

1. Evaluate the correctness of the answer.
2. Provide feedback on their logic.
3. Offer one helpful hint or suggestion if they seem confused.
4. Suggest what the next lesson or explanation should be (based on their performance).

Respond in this JSON format:
{
  "feedback": "...",
  "hint": "...",
  "nextLesson": "..."
}
  `.trim();

  try {
    console.log("📊 Evaluating student's answer...");
    const rawOutput = await callOpenRouter(prompt, 0.5, 1000);

    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      throw new Error("AI response was not valid JSON.");
    }

    console.log("✅ Feedback Summary:", parsed.feedback?.slice(0, 100), "...");

    // Optional: Save to Supabase
    /*
    const { error } = await supabase
      .from("adaptive_sessions")
      .insert([{ topic, question, answer, ...parsed }]);

    if (error) console.warn("⚠️ Supabase insert failed:", error.message);
    */

    res.status(200).json(parsed);
  } catch (err) {
    console.error("❌ Answer evaluation failed:", err.message);
    res.status(500).json({
      error: "Failed to evaluate the answer.",
      debug: err.message
    });
  }
});

/**
 * @route POST /api/adaptive/next-lesson
 * @desc Generates the next lesson based on topic and learning progress
 */
router.post("/next-lesson", async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Missing topic." });
  }

  const prompt = `
You are an Adaptive Tutor.

The student is learning about "${topic}".

Based on their last session, generate a short, clear, and engaging explanation or example to help them progress.

Keep it under 150 words.
  `.trim();

  try {
    console.log("📚 Generating next lesson...");
    const lesson = await callOpenRouter(prompt, 0.6, 500);

    if (!lesson) throw new Error("No lesson received from AI.");

    console.log("✅ Next lesson generated.");
    res.status(200).json({ lesson });
  } catch (err) {
    console.error("❌ Lesson generation failed:", err.message);
    res.status(500).json({
      error: "Failed to generate the next lesson.",
      debug: err.message
    });
  }
});

export default router;
