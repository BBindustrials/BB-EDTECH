// src/pages/Report.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../services/supabaseClient'
import jsPDF from 'jspdf'
import './Report.css'

const Report = () => {
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    generateReport()
  }, [timeRange])

  const generateReport = async () => {
    setLoading(true)
    try {
      const {data: user} = await supabase.auth.getUser()
      if (!user?.user?.id) return

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timeRange))

      // Fetch data from different modules
      const [socraticData, confusionData, mathData, adaptiveData] = await Promise.all([
        supabase
          .from('socratic_sessions')
          .select('*')
          .eq('user_id', user.user.id)
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('confusion_sessions')
          .select('*')
          .eq('user_id', user.user.id)
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('math_sessions')
          .select('*')
          .eq('user_id', user.user.id)
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('adaptive_sessions')
          .select('*')
          .eq('user_id', user.user.id)
          .gte('created_at', startDate.toISOString())
      ])

      const report = {
        timeRange: `${timeRange} days`,
        totalSessions: (socraticData.data?.length || 0) + 
                      (confusionData.data?.length || 0) + 
                      (mathData.data?.length || 0) + 
                      (adaptiveData.data?.length || 0),
        moduleBreakdown: {
          socratic: socraticData.data?.length || 0,
          confusion: confusionData.data?.length || 0,
          math: mathData.data?.length || 0,
          adaptive: adaptiveData.data?.length || 0
        },
        topicsStudied: [
          ...new Set([
            ...(socraticData.data?.map((s) => s.topic) || []),
            ...(confusionData.data?.map((s) => s.topic) || []),
            ...(mathData.data?.map((s) => s.topic) || [])
          ])
        ].filter(Boolean),
        averageSessionLength: '15 minutes', // Calculate this based on your data
        streakDays: calculateStreak(socraticData.data, confusionData.data, mathData.data)
      }

      setReportData(report)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStreak = (...sessionArrays) => {
    const allSessions = sessionArrays.flat().filter(Boolean)
    if (allSessions.length === 0) return 0

    const uniqueDays = [...new Set(
      allSessions.map((session) => 
        new Date(session.created_at).toDateString()
      )
    )].sort()

    let streak = 0
    const today = new Date().toDateString()
    
    for (let i = uniqueDays.length - 1; i >= 0; i--) {
      const dayDiff = Math.floor(
        (new Date(today) - new Date(uniqueDays[i])) / (1000 * 60 * 60 * 24)
      )
      
      if (dayDiff === streak) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const exportPDF = () => {
    if (!reportData) return

    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('BB EDTECH.AI - Learning Report', 10, 20)
    
    doc.setFontSize(12)
    let y = 40
    
    doc.text(`Report Period: Last ${reportData.timeRange}`, 10, y)
    y += 15
    
    doc.text(`Total Learning Sessions: ${reportData.totalSessions}`, 10, y)
    y += 10
    
    doc.text(`Learning Streak: ${reportData.streakDays} days`, 10, y)
    y += 20
    
    doc.text('Module Breakdown:', 10, y)
    y += 10
    
    Object.entries(reportData.moduleBreakdown).forEach(([module, count]) => {
      doc.text(`  ${module}: ${count} sessions`, 15, y)
      y += 8
    })
    
    if (reportData.topicsStudied.length > 0) {
      y += 10
      doc.text('Topics Studied:', 10, y)
      y += 10
      
      reportData.topicsStudied.slice(0, 10).forEach((topic) => {
        doc.text(`  • ${topic}`, 15, y)
        y += 8
      })
    }

    doc.save(`BB-EDTECH-Report-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
        <h1>📊 Learning Report</h1>
      </header>

      <div className="report-container">
        <div className="report-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
          
          {reportData && (
            <button onClick={exportPDF} className="export-btn">
              📥 Export PDF
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading">Generating your learning report...</div>
        ) : reportData ? (
          <div className="report-content">
            <div className="report-summary">
              <h2>Your Learning Summary</h2>
              <div className="summary-stats">
                <div className="stat-card">
                  <span className="stat-number">{reportData.totalSessions}</span>
                  <span className="stat-label">Total Sessions</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{reportData.streakDays}</span>
                  <span className="stat-label">Day Streak</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{reportData.topicsStudied.length}</span>
                  <span className="stat-label">Topics Studied</span>
                </div>
              </div>
            </div>

            <div className="module-breakdown">
              <h3>Module Usage</h3>
              <div className="module-stats">
                {Object.entries(reportData.moduleBreakdown).map(([module, count]) => (
                  <div key={module} className="module-stat">
                    <span className="module-name">
                      {module.charAt(0).toUpperCase() + module.slice(1)}
                    </span>
                    <span className="module-count">{count} sessions</span>
                    <div className="module-bar">
                      <div 
                        className="module-progress" 
                        style={{width: `${(count / reportData.totalSessions) * 100}%`}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {reportData.topicsStudied.length > 0 && (
              <div className="topics-section">
                <h3>Topics You've Explored</h3>
                <div className="topics-grid">
                  {reportData.topicsStudied.slice(0, 12).map((topic, index) => (
                    <span key={index} className="topic-tag">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="no-data">
            <p>No learning data available for the selected period.</p>
            <Link to="/dashboard" className="start-learning-btn">
              Start Learning Today
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Report