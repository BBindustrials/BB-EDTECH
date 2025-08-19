// routes/math-solver.js
import express from 'express'
import { createClient } from '@supabase/supabase-js'

// ✅ Initialize router
const router = express.Router()

// ✅ Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// ✅ OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

// ---------------- AUTH MIDDLEWARE ----------------
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

// ---------------- HELPER: CALL DEEPSEEK ----------------
const callDeepSeek = async (messages, maxTokens = 3000) => {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1", // ✅ Correct model slug
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: false
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`DeepSeek API error: ${response.status} ${errText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'No response from AI.'
  } catch (error) {
    console.error('DeepSeek API error:', error)
    throw new Error('Failed to get response from AI model')
  }
}

// ---------------- HELPER: SYSTEM PROMPT ----------------
const createSystemPrompt = (setupData) => {
  return `You are an expert math tutor helping a ${setupData.level} student studying ${setupData.field} in ${setupData.country}.

Your teaching approach:
1. Break problems into clear, simple steps.
2. Use relatable analogies from ${setupData.field} and ${setupData.country}.
3. Focus on concepts, not just solutions.
4. Always encourage learning with follow-up checks.
5. Use LaTeX ($...$ or $$...$$) for math notation.
6. Stay under 3000 tokens.`
}

// ---------------- ROUTES ----------------

// ✅ Solve initial problem
router.post('/solve', authenticateUser, async (req, res) => {
  try {
    const { setupData } = req.body

    if (!setupData || !setupData.problem) {
      return res.status(400).json({ error: 'Problem and setup data required' })
    }

    const systemPrompt = createSystemPrompt(setupData)
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please solve this step by step: ${setupData.problem}` }
    ]

    const solution = await callDeepSeek(aiMessages)

    // ✅ Save new session
    const { data: chatSession, error: chatError } = await supabase
      .from('math_solver_sessions')
      .insert({
        user_id: req.user.id,
        problem: setupData.problem,
        problem_preview: setupData.problem.substring(0, 100),
        level: setupData.level,
        country: setupData.country,
        field: setupData.field,
        setup_data: setupData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (chatError) {
      console.error('Database error:', chatError)
      return res.status(500).json({ error: 'Failed to create chat session' })
    }

    // ✅ Save initial messages
    await supabase.from('math_solver_messages').insert([
      {
        session_id: chatSession.id,
        role: 'user',
        content: setupData.problem,
        created_at: new Date().toISOString()
      },
      {
        session_id: chatSession.id,
        role: 'assistant',
        content: solution,
        created_at: new Date().toISOString()
      }
    ])

    res.json({ solution, sessionId: chatSession.id })
  } catch (error) {
    console.error('Solve error:', error)
    res.status(500).json({ error: 'Failed to solve problem' })
  }
})

// ✅ Continue chat
router.post('/chat', authenticateUser, async (req, res) => {
  try {
    const { messages, setupData, sessionId } = req.body
    if (!messages?.length) {
      return res.status(400).json({ error: 'Messages required' })
    }

    const systemPrompt = createSystemPrompt(setupData)
    const aiMessages = [{ role: 'system', content: systemPrompt }, ...messages.slice(-10)]
    const response = await callDeepSeek(aiMessages)

    // ✅ Save chat if sessionId provided
    if (sessionId) {
      const userMessage = messages[messages.length - 1]
      await supabase.from('math_solver_messages').insert([
        {
          session_id: sessionId,
          role: userMessage.role,
          content: userMessage.content,
          created_at: new Date().toISOString()
        },
        {
          session_id: sessionId,
          role: 'assistant',
          content: response,
          created_at: new Date().toISOString()
        }
      ])
    }

    res.json({ response })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Failed to process chat message' })
  }
})

// ✅ History
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const { data: sessions, error } = await supabase
      .from('math_solver_sessions')
      .select('id, problem_preview, level, field, country, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to fetch history' })
    }

    res.json(sessions || [])
  } catch (error) {
    console.error('History error:', error)
    res.status(500).json({ error: 'Failed to fetch chat history' })
  }
})

// ✅ Single chat fetch
router.get('/chat/:sessionId', authenticateUser, async (req, res) => {
  try {
    const { sessionId } = req.params

    const { data: session, error: sessionError } = await supabase
      .from('math_solver_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', req.user.id)
      .single()

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Chat session not found' })
    }

    const { data: messages, error: messagesError } = await supabase
      .from('math_solver_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Database error:', messagesError)
      return res.status(500).json({ error: 'Failed to fetch messages' })
    }

    res.json({
      setupData: session.setup_data,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    })
  } catch (error) {
    console.error('Get chat error:', error)
    res.status(500).json({ error: 'Failed to fetch chat session' })
  }
})

// ✅ Delete chat
router.delete('/chat/:sessionId', authenticateUser, async (req, res) => {
  try {
    const { sessionId } = req.params
    await supabase.from('math_solver_messages').delete().eq('session_id', sessionId)
    const { error } = await supabase
      .from('math_solver_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', req.user.id)

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to delete session' })
    }

    res.json({ message: 'Chat session deleted successfully' })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ error: 'Failed to delete chat session' })
  }
})

// ✅ User stats
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const { data: stats, error } = await supabase
      .from('math_solver_sessions')
      .select('level, field, created_at')
      .eq('user_id', req.user.id)

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to fetch stats' })
    }

    const totalSessions = stats.length
    const levelCounts = {}
    const fieldCounts = {}
    const monthlyActivity = {}

    stats.forEach(s => {
      levelCounts[s.level] = (levelCounts[s.level] || 0) + 1
      fieldCounts[s.field] = (fieldCounts[s.field] || 0) + 1
      const month = new Date(s.created_at).toISOString().substring(0, 7)
      monthlyActivity[month] = (monthlyActivity[month] || 0) + 1
    })

    res.json({ totalSessions, levelCounts, fieldCounts, monthlyActivity, recentActivity: stats.slice(0, 10) })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

export default router
