// src/pages/SocraticTutorPage.jsx
import React, {useState, useEffect, useRef} from 'react'
import {Link} from 'react-router-dom'
import { getSocraticResponse } from '../../services/aiservice';
import ReactMarkdown from 'react-markdown';
import supabase from '../../services/supabaseClient';
import jsPDF from 'jspdf'
import './TutorChat.css'

const openingMessage = {
  sender: 'ai',
  text: `Hello! I'm your Socratic Tutor 🎓 I help bridge gaps in your understanding by asking thoughtful questions that spark critical thinking. 

**What would you like to explore today?** 
- Mathematics concepts
- Science principles  
- Literature analysis
- History connections
- Or any topic that interests you!

Let's start our learning journey together! ✨`,
  timestamp: new Date().toISOString()
}

const TutorChat = () => {
  const [userId, setUserId] = useState(null)
  const [messages, setMessages] = useState([openingMessage])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [topic, setTopic] = useState('')
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [summaryGiven, setSummaryGiven] = useState(false)
  const [messageCount, setMessageCount] = useState(1)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showTopicEdit, setShowTopicEdit] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [messages])

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Load user and sessions on mount
  useEffect(() => {
    const fetchUser = async () => {
      const {data, error} = await supabase.auth.getUser()
      if (error) {
        console.error('❌ Error fetching user:', error.message)
        return
      }
      if (data?.user?.id) {
        setUserId(data.user.id)
        await loadSessions(data.user.id)
      }
    }
    fetchUser()
  }, [])

  const loadSessions = async (uid) => {
    const {data, error} = await supabase
      .from('socratic_sessions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', {ascending: false})

    if (error) {
      console.warn('⚠️ Could not load sessions:', error.message)
      return
    }

    if (data?.length) {
      setSessions(data)
      // Don't auto-load the first session - let user choose
    }
  }

  const loadSession = (session) => {
    setMessages(session.history || [openingMessage])
    setActiveSessionId(session.id)
    setTopic(session.topic || '')
    setMessageCount(session.history?.length || 1)
    setSummaryGiven(session.summary_given || false)
  }

  const handleNewSession = () => {
    setMessages([openingMessage])
    setActiveSessionId(null)
    setTopic('')
    setMessageCount(1)
    setSummaryGiven(false)
    setShowTopicEdit(false)
    inputRef.current?.focus()
  }

  const downloadSummaryAsPDF = () => {
    const doc = new jsPDF()
    doc.setFont('Times', 'normal')
    doc.setFontSize(16)
    doc.text('BB EDtech AI - Socratic Tutor Summary', 10, 20)
    
    doc.setFontSize(14)
    doc.text(`Topic: ${topic || 'Learning Session'}`, 10, 35)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 45)
    
    doc.setLineWidth(0.5)
    doc.line(10, 50, 200, 50)

    let y = 65
    doc.setFontSize(12)
    
    messages.forEach((msg, idx) => {
      if (msg.sender === 'ai' && (msg.text.toLowerCase().includes('summary') || msg.text.toLowerCase().includes('learned'))) {
        const title = `AI Summary ${idx}:`
        doc.setFont('Times', 'bold')
        doc.text(title, 10, y)
        y += 10
        
        doc.setFont('Times', 'normal')
        const cleanText = msg.text.replace(/\*+/g, '').replace(/#{1,6}\s*/g, '')
        const lines = doc.splitTextToSize(cleanText, 180)
        doc.text(lines, 10, y)
        y += lines.length * 6 + 10
        
        if (y > 270) {
          doc.addPage()
          y = 20
        }
      }
    })

    doc.save(`${topic || 'socratic-session'}-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = {
      sender: 'user', 
      text: input.trim(),
      timestamp: new Date().toISOString()
    }
    
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setLoading(true)
    setInput('')
    setMessageCount(prev => prev + 1)

    // Auto-set topic from first user message
    if (!topic && messageCount === 1) {
      const autoTopic = input.slice(0, 60).trim()
      setTopic(autoTopic)
    }

    try {
      // Create context-aware prompt with token efficiency
      const contextMessages = newMessages.slice(-6) // Keep only last 6 messages for context
      const aiReply = await getSocraticResponse(contextMessages)
      
      const aiMessage = {
        sender: 'ai',
        text: aiReply.replace(/Tutor:|Student:/gi, '').replace(/\*+/g, '').trim(),
        timestamp: new Date().toISOString()
      }
      
      const updatedMessages = [...newMessages, aiMessage]
      setMessages(updatedMessages)
      setMessageCount(prev => prev + 1)

      // Save session to Supabase
      if (userId) {
        const sessionData = {
          user_id: userId,
          topic: topic || input.slice(0, 50),
          history: updatedMessages,
          summary_given: summaryGiven,
          message_count: messageCount + 1
        }

        if (activeSessionId) {
          await supabase
            .from('socratic_sessions')
            .update(sessionData)
            .eq('id', activeSessionId)
        } else {
          const {data, error} = await supabase
            .from('socratic_sessions')
            .insert([sessionData])
            .select()

          if (data && data[0]?.id) {
            setActiveSessionId(data[0].id)
          }
          if (error) {
            console.warn("⚠️ Couldn't save session:", error.message)
          }
        }
      }

      // Auto-trigger summary after meaningful conversation
      if (!summaryGiven && messageCount >= 12 && Math.random() > 0.7) {
        setTimeout(async () => {
          try {
            const summaryPrompt = [
              ...updatedMessages.slice(-4),
              {sender: 'user', text: 'Please provide a brief summary of what we\'ve learned together.'}
            ]

            const aiSummary = await getSocraticResponse(summaryPrompt)
            const summaryMessage = {
              sender: 'ai',
              text: `📚 **Learning Summary:**\n\n${aiSummary.replace(/Tutor:|Student:/gi, '').trim()}`,
              timestamp: new Date().toISOString()
            }
            
            setMessages(prev => [...prev, summaryMessage])
            setSummaryGiven(true)
          } catch (err) {
            console.error('Summary generation failed:', err)
          }
        }, 2000)
      }

    } catch (err) {
      console.error('❌ AI Error:', err.message)
      const errorMessage = {
        sender: 'ai',
        text: '⚠️ I encountered a technical issue. Could you rephrase your question?',
        timestamp: new Date().toISOString()
      }
      setMessages([...newMessages, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
  }

  return (
    <div className="page-wrapper">
      <header className="page-header enhanced">
        <div className="header-left">
          <Link to="/dashboard" className="back-button modern">
            ← Dashboard
          </Link>
          <h1 className="page-title">
            🎓 Socratic Tutor
            <span className="subtitle">Learn through thoughtful questioning</span>
          </h1>
        </div>
        <div className="header-stats">
          <span className="message-counter">Messages: {messageCount}</span>
          {topic && <span className="current-topic">Topic: {topic}</span>}
        </div>
      </header>

      <div className="tutor-page enhanced">
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <h2>📚 Learning Sessions</h2>
            <button 
              className="collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
          
          {!sidebarCollapsed && (
            <>
              <button onClick={handleNewSession} className="new-session-btn">
                ✨ Start New Session
              </button>
              
              <div className="sessions-list">
                {sessions.length === 0 ? (
                  <div className="empty-state">
                    <p>No previous sessions</p>
                    <small>Start your first learning conversation!</small>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`session-item ${activeSessionId === session.id ? 'active' : ''}`}
                      onClick={() => loadSession(session)}
                    >
                      <div className="session-title">
                        🗂 {session.topic || 'Untitled Session'}
                      </div>
                      <div className="session-meta">
                        <span className="session-date">
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                        <span className="session-messages">
                          {session.history?.length || 0} messages
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </aside>

        <main className="chat-container enhanced">
          <div className="chat-header enhanced">
            <div className="topic-section">
              {showTopicEdit ? (
                <div className="topic-edit">
                  <input
                    type="text"
                    value={topic}
                    placeholder="What are we exploring today?"
                    onChange={(e) => setTopic(e.target.value)}
                    onBlur={() => setShowTopicEdit(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setShowTopicEdit(false)
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <div 
                  className="topic-display" 
                  onClick={() => setShowTopicEdit(true)}
                  title="Click to edit topic"
                >
                  {topic ? (
                    <span className="topic-text">📖 {topic}</span>
                  ) : (
                    <span className="topic-placeholder">Click to set topic...</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="chat-actions">
              {summaryGiven && (
                <button onClick={downloadSummaryAsPDF} className="action-btn pdf">
                  📥 Export PDF
                </button>
              )}
              <button onClick={handleNewSession} className="action-btn new">
                ✨ New Chat
              </button>
            </div>
          </div>

          <div className="chat-window enhanced">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender} enhanced`}>
                <div className="message-header">
                  {msg.sender === 'ai' ? (
                    <span className="sender-icon">🤖 BB Tutor</span>
                  ) : (
                    <span className="sender-icon">👤 You</span>
                  )}
                  {msg.timestamp && (
                    <span className="timestamp">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  )}
                </div>
                <div className="message-content">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message ai enhanced loading">
                <div className="message-header">
                  <span className="sender-icon">🤖 BB Tutor</span>
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                    Crafting thoughtful questions...
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="input-area enhanced">
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                placeholder="Share your thoughts, questions, or what you'd like to explore..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={2}
                disabled={loading}
              />
              <button 
                onClick={sendMessage} 
                disabled={!input.trim() || loading}
                className="send-button"
              >
                {loading ? '⏳' : '🚀'}
              </button>
            </div>
            <div className="input-footer">
              <small>Press Enter to send • Shift+Enter for new line • Max 3000 tokens per request</small>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default TutorChat