// server/controllers/adaptive.controller.js
import supabase from '../services/supabaseClient.js';
import axios from 'axios';

// Load environment variables
const { OPENROUTER_API_KEY } = process.env;

// ✅ Helper: Call AI API (DeepSeek via OpenRouter)
const callAI = async (prompt) => {
  try {
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1:free',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return res.data.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error("❌ AI API Error:", err.response?.data || err.message);
    throw new Error("AI generation failed.");
  }
};

// ============================
// 📌 Controller Functions
// ============================

// 1️⃣ Start Diagnostic
export const startDiagnostic = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Missing topic." });

    // Call AI for diagnostic question(s)
    const question = await callAI(
      `Generate a simple diagnostic question for a student on the topic: ${topic}.
       Keep it short and clear.`
    );

    // Save diagnostic start to Supabase
    await supabase.from('adaptive_sessions').insert([
      { topic, stage: 'diagnostic', question }
    ]);

    res.json({ question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2️⃣ Submit Answer
export const submitAnswer = async (req, res) => {
  try {
    const { topic, question, answer } = req.body;
    if (!topic || !question || !answer) {
      return res.status(400).json({ error: "Missing topic, question, or answer." });
    }

    // Save answer in Supabase
    await supabase.from('adaptive_answers').insert([
      { topic, question, answer }
    ]);

    // Generate feedback using AI
    const feedback = await callAI(
      `The student answered: "${answer}" to the question: "${question}" on topic "${topic}".
       Provide short constructive feedback.`
    );

    res.json({ feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3️⃣ Get Next Lesson
export const getNextLesson = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Missing topic." });

    // Generate next lesson content
    const lesson = await callAI(
      `Create the next short lesson on topic "${topic}" for an adaptive learning system.
       Use bullet points and simple explanations.`
    );

    // Save lesson in Supabase
    await supabase.from('adaptive_lessons').insert([
      { topic, lesson }
    ]);

    res.json({ lesson });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
