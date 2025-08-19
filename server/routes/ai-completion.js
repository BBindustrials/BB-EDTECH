import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Ensure .env is loaded before anything else

const router = express.Router();

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// OpenRouter + DeepSeek R1 configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error('OpenRouter API key not configured');
}

// IDD Helper system prompt optimized for 3000 tokens
const IDD_SYSTEM_PROMPT = `You are an IDD education specialist. Create concise, actionable lesson plans for students with intellectual/developmental disabilities.

ALWAYS include:
1) SMART objective (Student will [behavior] given [condition] with [criterion] in [time])
2) 10-15min lesson script: Teacher says → Student does (3-5 steps max)
3) Two scaffolds: High support + Independent
4) 3 quick checks: 0=no response, 1=prompted, 2=independent
5) Home activity with household items
6) 2 behavior supports
7) Weekly data tracking

Use simple language. Be specific. No fluff.`;

// POST /api/ai-completion - Generate IDD lesson plan
router.post('/', async (req, res) => {
  try {
    const { prompt, maxTokens = 2500, temperature = 0.7, userId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🎯 Generating IDD lesson plan via DeepSeek R1 (OpenRouter)...');

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1',
        messages: [
          { role: 'system', content: IDD_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const completion = data.choices?.[0]?.message?.content || '';

    console.log('✅ Generated lesson plan successfully');

    // Store in Supabase for tracking
    try {
      const { error: dbError } = await supabase
        .from('idd_generations')
        .insert({
          user_id: userId || null,
          prompt: prompt.substring(0, 500), // Store first 500 chars for tracking
          completion: completion,
          tokens_used: data.usage?.total_tokens || 0,
          created_at: new Date()
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }
    } catch (dbErr) {
      console.error('Database connection error:', dbErr);
    }

    res.status(200).json({
      completion,
      tokensUsed: data.usage?.total_tokens || 0,
      success: true
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      error: 'Failed to generate lesson plan',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      success: false
    });
  }
});

// GET /api/ai-completion/history/:userId - Get user's generation history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('idd_generations')
      .select('id, prompt, tokens_used, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit, 10));

    if (error) throw error;

    res.json({ history: data || [], success: true });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history', success: false });
  }
});

export default router;
