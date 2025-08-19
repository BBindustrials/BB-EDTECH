// server.js
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config()

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// ✅ CORS setup
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-domain.com'] // change this to your deployed frontend domain
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}))

// ✅ JSON & URL parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ✅ Request logger
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`)
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", req.body)
  }

  next()
})

// ✅ Import routes
import confusionRoute from './routes/confusion.js'
import socraticRoutes from './routes/socratic.js'
import adaptiveRoutes from './routes/adaptive.js'
import mathSolverRoutes from './routes/Math.js' 
import ttsapi from './routes/api.js'
import aiCompletionRouter from './routes/ai-completion.js'
import { requireAuth } from "./middlewares/auth.js"
import authRoutes from './routes/Auth.js'

// 🟣 Public (auth does NOT need token)
app.use("/api/auth", authRoutes)

// 🔒 Secure everything else
app.use("/api", requireAuth)

// ✅ Mount routes
app.use('/api/confusion', confusionRoute)
app.use('/api/socratic', socraticRoutes)
app.use('/api/adaptive', adaptiveRoutes)
app.use('/api/math-solver', mathSolverRoutes)   // 👈 matches routes/math.js
app.use('/api/tts', ttsapi)
app.use('/api/ai-completion', aiCompletionRouter)


// ✅ Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' })
})

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// ✅ Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📋 Available routes:`)
  console.log(`   GET  http://localhost:${PORT}/test`)
  console.log(`   GET  http://localhost:${PORT}/api/health`)
  console.log(`   POST http://localhost:${PORT}/api/math-solver/solve`)
  console.log(`   GET  http://localhost:${PORT}/api/math-solver/history`)
})

export default app
