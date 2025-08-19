// src/pages/AdaptiveTutorPage.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchDiagnostic, submitAnswer, getNextLesson } from "../../services/adaptiveTutorService";
import TeX from '@matejmazur/react-katex'
import 'katex/dist/katex.min.css'
import ReactMarkdown from 'react-markdown'
import './AdaptiveTutor.css'

const AdaptiveTutor = () => {
  const [stage, setStage] = useState('intro')
  const [topic, setTopic] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [hint, setHint] = useState('')
  const [lesson, setLesson] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionHistory, setSessionHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState(null)

  // Initialize session on component mount
  useEffect(() => {
    if (!sessionStartTime) {
      setSessionStartTime(new Date())
    }
  }, [])

  const renderMessage = (text) => {
    if (!text) return null

    const mathRegex = /(\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\))/g
    const parts = text.split(mathRegex).filter(Boolean)

    return (
      <div className="message-block">
        {parts.map((part, index) => {
          if (
            (part.startsWith('$$') && part.endsWith('$$')) ||
            (part.startsWith('\\[') && part.endsWith('\\]')) ||
            (part.startsWith('\\(') && part.endsWith('\\)'))
          ) {
            const cleaned = part.replace(/^\$\$|\\\[|\\\(|\$\$|\\\]|\\\)$/g, '')
            return <TeX key={index} block>{cleaned}</TeX>
          } else if (part.startsWith('$') && part.endsWith('$')) {
            const cleaned = part.replace(/^\$|\$$/g, '')
            return <TeX key={index}>{cleaned}</TeX>
          } else {
            return (
              <div key={index} className="markdown-text">
                <ReactMarkdown>{part}</ReactMarkdown>
              </div>
            )
          }
        })}
      </div>
    )
  }

  const addToHistory = (type, content, timestamp = new Date()) => {
    const historyEntry = {
      id: Date.now(),
      type, // 'question', 'answer', 'feedback', 'lesson'
      content,
      timestamp,
      topic: topic
    }
    setSessionHistory(prev => [...prev, historyEntry])
  }

  const handleStart = async () => {
    if (!topic.trim()) return alert('Please enter a topic.')
    setLoading(true)
    try {
      const res = await fetchDiagnostic(topic)
      setQuestion(res.question)
      setStage('diagnostic')
      
      // Add question to history
      addToHistory('question', res.question)
    } catch (err) {
      alert('Failed to load diagnostic question.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!answer.trim()) return alert('Please enter your answer.')
    setLoading(true)
    
    // Add answer to history
    addToHistory('answer', answer)
    
    try {
      const res = await submitAnswer({topic, question, answer})
      setFeedback(res.feedback)
      setHint(res.hint)
      setLesson(res.nextLesson)
      setStage('feedback')
      
      // Add feedback to history
      addToHistory('feedback', res.feedback)
      if (res.hint) {
        addToHistory('hint', res.hint)
      }
    } catch (err) {
      alert('Error evaluating your answer.')
    } finally {
      setLoading(false)
    }
  }

  const handleNextLesson = async () => {
    setLoading(true)
    try {
      const res = await getNextLesson(topic)
      setLesson(res.lesson)
      setStage('lesson')
      
      // Add lesson to history
      addToHistory('lesson', res.lesson)
    } catch (err) {
      alert('Error loading next lesson.')
    } finally {
      setLoading(false)
    }
  }

  const resetSession = () => {
    setStage('intro')
    setTopic('')
    setQuestion('')
    setAnswer('')
    setFeedback('')
    setHint('')
    setLesson('')
    setSessionHistory([])
    setShowHistory(false)
    setSessionStartTime(new Date())
  }

  const clearHistory = () => {
    setSessionHistory([])
    setShowHistory(false)
  }

  const getSessionStats = () => {
    const totalInteractions = sessionHistory.length
    const questionsAsked = sessionHistory.filter(h => h.type === 'question').length
    const answersGiven = sessionHistory.filter(h => h.type === 'answer').length
    const lessonsCompleted = sessionHistory.filter(h => h.type === 'lesson').length
    const sessionDuration = sessionStartTime ? 
      Math.round((new Date() - sessionStartTime) / 1000 / 60) : 0

    return { totalInteractions, questionsAsked, answersGiven, lessonsCompleted, sessionDuration }
  }

  const stats = getSessionStats()

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <div className="header-left">
          <Link to="/dashboard" className="back-button">
            <span className="back-icon">←</span>
            <span>Back to Dashboard</span>
          </Link>
        </div>
        
        <div className="header-center">
          <h1 className="page-title">
            <span className="title-icon">🎯</span>
            Adaptive Tutor
          </h1>
        </div>
        
        <div className="header-right">
          <div className="session-controls">
            <button 
              className={`history-toggle ${showHistory ? 'active' : ''}`}
              onClick={() => setShowHistory(!showHistory)}
              title="Toggle Session History"
            >
              <span className="history-icon">📝</span>
              <span className="history-count">{sessionHistory.length}</span>
            </button>
            
            {sessionHistory.length > 0 && (
              <div className="session-stats-mini">
                <span className="stat-item">
                  <span className="stat-icon">⏱️</span>
                  <span>{stats.sessionDuration}m</span>
                </span>
                <span className="stat-item">
                  <span className="stat-icon">💬</span>
                  <span>{stats.questionsAsked}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="main-content">
        {/* Session History Sidebar */}
        <div className={`history-sidebar ${showHistory ? 'show' : ''}`}>
          <div className="history-header">
            <h3>
              <span className="history-title-icon">📚</span>
              Session History
            </h3>
            <div className="history-actions">
              <button 
                className="clear-history-btn" 
                onClick={clearHistory}
                disabled={sessionHistory.length === 0}
                title="Clear History"
              >
                🗑️
              </button>
              <button 
                className="close-history-btn"
                onClick={() => setShowHistory(false)}
                title="Close History"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="session-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Duration</span>
                <span className="stat-value">{stats.sessionDuration}m</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Questions</span>
                <span className="stat-value">{stats.questionsAsked}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Answers</span>
                <span className="stat-value">{stats.answersGiven}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Lessons</span>
                <span className="stat-value">{stats.lessonsCompleted}</span>
              </div>
            </div>
          </div>
          
          <div className="history-timeline">
            {sessionHistory.length === 0 ? (
              <div className="empty-history">
                <span className="empty-icon">📝</span>
                <p>Your session history will appear here</p>
              </div>
            ) : (
              sessionHistory.map((entry, index) => (
                <div key={entry.id} className={`history-entry ${entry.type}`}>
                  <div className="entry-header">
                    <span className="entry-icon">
                      {entry.type === 'question' && '❓'}
                      {entry.type === 'answer' && '✍️'}
                      {entry.type === 'feedback' && '✅'}
                      {entry.type === 'hint' && '💡'}
                      {entry.type === 'lesson' && '📘'}
                    </span>
                    <span className="entry-type">{entry.type}</span>
                    <span className="entry-time">
                      {entry.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="entry-content">
                    {renderMessage(entry.content)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Tutor Interface */}
        <div className="adaptive-tutor">
          {stage === 'intro' && (
            <div className="intro-card">
              <div className="intro-header">
                <div className="intro-icon">🚀</div>
                <h2>Start Your Learning Journey</h2>
                <p>What topic would you like to explore today?</p>
              </div>
              
              <div className="intro-form">
                <div className="input-container">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="E.g., Calculus, Machine Learning, Creative Writing..."
                    className="topic-input"
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleStart()}
                  />
                  <div className="input-decoration"></div>
                </div>
                
                <button 
                  onClick={handleStart} 
                  disabled={loading || !topic.trim()}
                  className="start-button"
                >
                  <span className="button-content">
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span className="start-icon">🎯</span>
                        <span>Start Diagnostic</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
              
              {sessionHistory.length > 0 && (
                <div className="session-preview">
                  <h4>Previous Activity</h4>
                  <div className="activity-summary">
                    <span>Last topic: <strong>{topic || 'Various topics'}</strong></span>
                    <span>Total interactions: <strong>{sessionHistory.length}</strong></span>
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === 'diagnostic' && (
            <div className="diagnostic-card">
              <div className="card-header">
                <h3>
                  <span className="header-icon">🧠</span>
                  Diagnostic Question
                </h3>
                <div className="progress-indicator">
                  <div className="progress-dot active"></div>
                  <div className="progress-dot"></div>
                  <div className="progress-dot"></div>
                </div>
              </div>
              
              <div className="question-container">
                <div className="question-content">
                  {renderMessage(question)}
                </div>
              </div>
              
              <div className="answer-section">
                <div className="input-container">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Share your thoughts and reasoning here..."
                    className="answer-input"
                    rows="5"
                  />
                  <div className="input-decoration"></div>
                </div>
                
                <div className="action-buttons">
                  <button 
                    onClick={handleSubmit} 
                    disabled={loading || !answer.trim()}
                    className="submit-button"
                  >
                    <span className="button-content">
                      {loading ? (
                        <>
                          <span className="spinner"></span>
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <span className="submit-icon">📤</span>
                          <span>Submit Answer</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {stage === 'feedback' && (
            <div className="feedback-card">
              <div className="card-header">
                <h3>
                  <span className="header-icon">✨</span>
                  Your Feedback
                </h3>
                <div className="progress-indicator">
                  <div className="progress-dot completed"></div>
                  <div className="progress-dot active"></div>
                  <div className="progress-dot"></div>
                </div>
              </div>
              
              <div className="feedback-section">
                <div className="feedback-content">
                  <div className="content-header">
                    <span className="content-icon">✅</span>
                    <span className="content-title">Feedback</span>
                  </div>
                  <div className="content-body">
                    {renderMessage(feedback)}
                  </div>
                </div>
                
                {hint && (
                  <div className="hint-content">
                    <div className="content-header">
                      <span className="content-icon">💡</span>
                      <span className="content-title">Helpful Hint</span>
                    </div>
                    <div className="content-body">
                      {renderMessage(hint)}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="action-buttons">
                <button 
                  onClick={handleNextLesson} 
                  disabled={loading}
                  className="continue-button"
                >
                  <span className="button-content">
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        <span>Preparing lesson...</span>
                      </>
                    ) : (
                      <>
                        <span className="continue-icon">📚</span>
                        <span>Continue Learning</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          )}

          {stage === 'lesson' && (
            <div className="lesson-card">
              <div className="card-header">
                <h3>
                  <span className="header-icon">📘</span>
                  Your Personalized Lesson
                </h3>
                <div className="progress-indicator">
                  <div className="progress-dot completed"></div>
                  <div className="progress-dot completed"></div>
                  <div className="progress-dot active"></div>
                </div>
              </div>
              
              <div className="lesson-content">
                <div className="content-body">
                  {renderMessage(lesson)}
                </div>
              </div>
              
              <div className="action-buttons">
                <button 
                  onClick={handleNextLesson} 
                  disabled={loading}
                  className="next-button"
                >
                  <span className="button-content">
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <>
                        <span className="next-icon">➡️</span>
                        <span>Next Lesson</span>
                      </>
                    )}
                  </span>
                </button>
                
                <button 
                  onClick={resetSession}
                  className="reset-button"
                >
                  <span className="button-content">
                    <span className="reset-icon">🔄</span>
                    <span>New Session</span>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdaptiveTutor