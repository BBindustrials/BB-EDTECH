import axios from 'axios';

// Optional utilities — replace with actual implementations
import { parseSteps } from '../utils/parseSteps.js';
import { logMathAttempt } from '../services/logger.js';
import { evaluateAnswer } from '../utils/evaluateAnswer.js';

export const solveMath = async (req, res) => {
  const { question, level = 'Beginner', studentAnswer, userId } = req.body;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ Missing OpenRouter API key');
    return res.status(500).json({ error: 'Missing OpenRouter API key' });
  }

  const model = 'deepseek-r1';

  const explainPrompt = `
You are a professional math tutor. A ${level.toLowerCase()} student asked:

"${question}"

Instructions:
1. Break the problem into steps (no skipping).
2. Use analogies and simple language.
3. Tailor explanation to a ${level} student.
4. Provide a clear, concise conclusion for the solution.
5. Focus on teaching the concept, not just solving.

Do not add any spoken version or voiceover.
Do not return JSON.
Only return the clean step-by-step explanation.
Keep each step short and focused.
`.trim();

  const ttsPrompt = `
You are a math tutor preparing content for voice-over.

A ${level.toLowerCase()} student asked:

"${question}"

Generate a clear spoken script that explains the solution step by step, converting all math symbols into spoken English.

Example: "x²" → "x squared", "√x" → "square root of x".

Respond with only the spoken version.
`.trim();

  try {
    console.log('📤 Sending prompts to OpenRouter...');

    const [explainRes, ttsRes] = await Promise.all([
      axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages: [{ role: 'user', content: explainPrompt }],
          max_tokens: 300,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'BB Edtech Math Solver',
          },
        }
      ),

      axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages: [{ role: 'user', content: ttsPrompt }],
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'BB Edtech TTS Script Generator',
          },
        }
      ),
    ]);

    const stepsRaw = explainRes?.data?.choices?.[0]?.message?.content?.trim();
    const spokenScript = ttsRes?.data?.choices?.[0]?.message?.content?.trim();

    if (!stepsRaw || !spokenScript) {
      console.error('❌ Missing response content from OpenRouter');
      return res.status(500).json({ error: 'Invalid AI response structure' });
    }

    const steps = parseSteps(stepsRaw); // Convert raw string to array of {text, tts}

    // Optionally log student's attempt for analytics/tracking
    if (userId && studentAnswer) {
      const correct = evaluateAnswer(question, studentAnswer); // Optional grading function
      await logMathAttempt(userId, question, studentAnswer, correct);
    }

    console.log('✅ Math solution + TTS script generated');

    return res.status(200).json({ steps, spokenScript });

  } catch (err) {
    console.error('❌ AI processing failed:', err.message);
    if (err.response) {
      console.error('🧾 Response Error:', err.response.data);
    }
    return res.status(500).json({ error: 'Failed to process math explanation or TTS.' });
  }
};
