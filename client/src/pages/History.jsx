// src/pages/History.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../services/supabaseClient'
import './History.css'

const History = () => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const {data: user} = await supabase.auth.getUser()
      if (!user?.user?.id) return

      // Load from multiple tables
      const [socraticSessions, confusionSession, mathSessions, mathSolverSession, mathSolverMessage] = await Promise.all([
        supabase.from('socratic_sessions').select('*').eq('user_id', user.user.id),
        supabase.from('confusion_session').select('*').eq('user_id', user.user.id),
        supabase.from('math_sessions').select('*').eq('user_id', user.user.id),
        supabase.from('math_solver_session').select('*').eq('user_id', user.user.id),
        supabase.from('math_solver_message').select('*').eq('user_id', user.user.id)
      ])

      const allSessions = [
        ...(socraticSessions.data || []).map((s) => ({...s, type: 'Socratic Tutor'})),
        ...(confusionSession.data || []).map((s) => ({...s, type: 'Confusion Solver'})),
        ...(mathSessions.data || []).map((s) => ({...s, type: 'Math Solver'})),
        ...(mathSolverSession.data || []).map((s) => ({...s, type: 'Math Solver Session'})),
        ...(mathSolverMessage.data || []).map((s) => ({...s, type: 'Math Solver Message'}))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setSessions(allSessions)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = sessions.filter((session) => 
    filter === 'all' || session.type.toLowerCase().includes(filter)
  )

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
        <h1>📚 Learning History</h1>
      </header>

      <div className="history-container">
        <div className="filter-section">
          <label>Filter by tool:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Sessions</option>
            <option value="socratic">Socratic Tutor</option>
            <option value="confusion">Confusion Solver</option>
            <option value="math">Math Solver</option>
            <option value="adaptive">Adaptive Tutor</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading your learning history...</div>
        ) : (
          <div className="sessions-grid">
            {filteredSessions.length === 0 ? (
              <div className="no-sessions">
                <p>No sessions found. Start learning to build your history!</p>
                <Link to="/dashboard" className="start-learning-btn">Start Learning</Link>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div key={`${session.type}-${session.id}`} className="session-card">
                  <div className="session-header">
                    <span className="session-type">{session.type}</span>
                    <span className="session-date">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="session-topic">{session.topic || 'Untitled Session'}</h3>
                  <p className="session-preview">
                    {session.history?.length 
                      ? `${session.history.length} interactions`
                      : 'Session completed'
                    }
                  </p>
                  <div className="session-actions">
                    <button 
                      className="view-details-btn"
                      onClick={() => {/* Add view details functionality */}}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default History
