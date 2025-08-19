import React, { useState, useEffect } from 'react'
import { Send, User, Bot, History, BookOpen, Calculator } from 'lucide-react'
import './MathSolver.css'
import supabase from "../services/supabaseClient";


const MathSolver = () => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(true)
  const [chatHistory, setChatHistory] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [session, setSession] = useState(null)

  // Setup form state
  const [setupData, setSetupData] = useState({
    level: '',
    country: '',
    field: '',
    problem: ''
  })

  const levels = [
    'Secondary School',
    'Undergraduate',
    'Post Graduate',
    'Researcher',
    'Professional'
  ]

  // ✅ Load user session once
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    // Subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    loadChatHistory()

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // ✅ Helper to always fetch with Supabase token
  const fetchWithAuth = async (url, options = {}) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    })
  }

  const loadChatHistory = async () => {
    try {
      const response = await fetchWithAuth('/api/math-solver/history')
      if (response.ok) {
        const history = await response.json()
        setChatHistory(history)
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const startNewSession = async () => {
    if (!setupData.level || !setupData.country || !setupData.field || !setupData.problem) {
      alert('Please fill in all fields before starting')
      return
    }

    setIsLoading(true)
    setShowSetup(false)

    const initialMessage = {
      role: 'system',
      content: `Student Profile:
- Level: ${setupData.level}
- Country: ${setupData.country}
- Field of Study: ${setupData.field}
- Problem: ${setupData.problem}

Please analyze this math problem and provide a step-by-step solution with explanations suitable for their level and field.`
    }

    try {
      const response = await fetchWithAuth('/api/math-solver/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [initialMessage],
          setupData
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([
          { role: 'user', content: setupData.problem },
          { role: 'assistant', content: data.solution }
        ])
      }
    } catch (error) {
      console.error('Failed to solve problem:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // LaTeX rendering component
  const LaTeXRenderer = ({ content }) => {
    useEffect(() => {
      // Load KaTeX from CDN and render math
      if (window.katex) {
        renderMath()
      } else {
        loadKaTeX().then(() => renderMath())
      }
    }, [content])

    const loadKaTeX = () => {
      return new Promise((resolve) => {
        if (window.katex) {
          resolve()
          return
        }

        // Load KaTeX CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.13.24/katex.min.css'
        document.head.appendChild(link)

        // Load KaTeX JS
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.13.24/katex.min.js'
        script.onload = resolve
        document.head.appendChild(script)
      })
    }

    const renderMath = () => {
      const container = document.getElementById(`math-container-${Date.now()}`)
      if (container && window.katex) {
        try {
          // Replace inline math $...$ with rendered KaTeX
          let processedContent = content.replace(/\$([^$]+)\$/g, (match, math) => {
            try {
              return window.katex.renderToString(math, { displayMode: false })
            } catch (e) {
              return match
            }
          })

          // Replace display math $...$ with rendered KaTeX
          processedContent = processedContent.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
            try {
              return window.katex.renderToString(math, { displayMode: true })
            } catch (e) {
              return match
            }
          })

          container.innerHTML = processedContent
        } catch (error) {
          container.textContent = content
        }
      }
    }

    return (
      <div 
        id={`math-container-${Date.now()}`}
        className="latex-content"
      >
        {content}
      </div>
    )
  }

  // ✅ Send chat messages
  const sendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage = { role: 'user', content: inputValue }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetchWithAuth('/api/math-solver/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          setupData
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...updatedMessages, { role: 'assistant', content: data.response }])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadChatSession = async (chatId) => {
    try {
      const response = await fetchWithAuth(`/api/math-solver/chat/${chatId}`)
      if (response.ok) {
        const chatData = await response.json()
        setMessages(chatData.messages)
        setSetupData(chatData.setupData)
        setShowSetup(false)
        setSelectedChat(chatId)
        setShowHistory(false)
      }
    } catch (error) {
      console.error('Failed to load chat session:', error)
    }
  }

  const resetSession = () => {
    setMessages([])
    setSetupData({ level: '', country: '', field: '', problem: '' })
    setShowSetup(true)
    setSelectedChat(null)
  }

  if (showSetup) {
    return (
      <div className="setup-container">
        <div className="setup-wrapper">
          {/* Header */}
          <div className="setup-header">
            <div className="header-icon-title">
              <Calculator className="header-icon" />
              <h1 className="main-title">
                Math Solver & Explainer
              </h1>
            </div>
            <p className="header-subtitle">
              Get personalized step-by-step solutions with explanations tailored to your level and field
            </p>
          </div>

          {/* Setup Form */}
          <div className="setup-form">
            <h2 className="form-title">
              <BookOpen className="form-title-icon" />
              Tell us about yourself
            </h2>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Academic Level
                </label>
                <select
                  value={setupData.level}
                  onChange={(e) => setSetupData({...setupData, level: e.target.value})}
                  className="form-select"
                >
                  <option value="">Select your level</option>
                  {levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Country/Region
                </label>
                <input
                  type="text"
                  value={setupData.country}
                  onChange={(e) => setSetupData({...setupData, country: e.target.value})}
                  placeholder="Enter your country/region"
                  className="form-input"
                />
              </div>

              <div className="form-group form-group-full">
                <label className="form-label">
                  Field of Study
                </label>
                <input
                  type="text"
                  value={setupData.field}
                  onChange={(e) => setSetupData({...setupData, field: e.target.value})}
                  placeholder="e.g., Mathematics, Physics, Engineering, etc."
                  className="form-input"
                />
              </div>
            </div>

            <div className="problem-group">
              <label className="form-label">
                Math Problem
              </label>
              <textarea
                value={setupData.problem}
                onChange={(e) => setSetupData({...setupData, problem: e.target.value})}
                placeholder="Enter your math problem here... (e.g., Solve the quadratic equation: 2x² + 5x - 3 = 0)"
                className="problem-textarea"
                rows="4"
              />
            </div>

            <div className="form-actions">
              <button
                onClick={startNewSession}
                disabled={isLoading}
                className="start-button"
              >
                {isLoading ? 'Starting...' : 'Start Solving'}
              </button>
              
              <button
                onClick={() => setShowHistory(true)}
                className="history-button"
              >
                <History className="button-icon" />
              </button>
            </div>
          </div>

          {/* Chat History Modal */}
          {showHistory && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Chat History</h3>
                </div>
                <div className="modal-body">
                  {chatHistory.length === 0 ? (
                    <p className="empty-history">No previous chats found</p>
                  ) : (
                    <div className="history-list">
                      {chatHistory.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => loadChatSession(chat.id)}
                          className="history-item"
                        >
                          <div className="history-problem">
                            {chat.problem_preview}
                          </div>
                          <div className="history-meta">
                            {chat.level} • {chat.field} • {new Date(chat.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    onClick={() => setShowHistory(false)}
                    className="close-button"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-content">
          <div className="chat-header-info">
            <Calculator className="chat-header-icon" />
            <div>
              <h1 className="chat-title">Math Solver</h1>
              <p className="chat-subtitle">
                {setupData.level} • {setupData.field} • {setupData.country}
              </p>
            </div>
          </div>
          <div className="chat-header-actions">
            <button
              onClick={() => setShowHistory(true)}
              className="header-action-button"
            >
              <History className="button-icon" />
            </button>
            <button
              onClick={resetSession}
              className="new-problem-button"
            >
              New Problem
            </button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="chat-interface">
        {/* Messages */}
        <div className="messages-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message-wrapper ${message.role === 'user' ? 'user-message-wrapper' : 'assistant-message-wrapper'}`}
            >
              <div className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}>
                <div className="message-content">
                  <div className={`message-avatar ${message.role === 'user' ? 'user-avatar' : 'assistant-avatar'}`}>
                    {message.role === 'user' ? (
                      <User className="avatar-icon" />
                    ) : (
                      <Bot className="avatar-icon" />
                    )}
                  </div>
                  <div className="message-text">
                    {message.role === 'assistant' ? (
                      <LaTeXRenderer content={message.content} />
                    ) : (
                      <p className="user-text">{message.content}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="loading-wrapper">
              <div className="loading-message">
                <div className="loading-content">
                  <div className="loading-avatar">
                    <Bot className="avatar-icon" />
                  </div>
                  <div className="loading-dots">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="input-container">
          <div className="input-wrapper">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a follow-up question or request clarification..."
              className="message-input"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="send-button"
            >
              <Send className="button-icon" />
            </button>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Chat History</h3>
            </div>
            <div className="modal-body">
              {chatHistory.length === 0 ? (
                <p className="empty-history">No previous chats found</p>
              ) : (
                <div className="history-list">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => loadChatSession(chat.id)}
                      className="history-item"
                    >
                      <div className="history-problem">
                        {chat.problem_preview}
                      </div>
                      <div className="history-meta">
                        {chat.level} • {chat.field} • {new Date(chat.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowHistory(false)}
                className="close-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MathSolver