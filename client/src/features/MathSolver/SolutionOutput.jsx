import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import './SolutionOutput.css'

const SolutionOutput = ({ solution, onProceedToChallenge }) => {
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [voices, setVoices] = useState([])
  const [rate, setRate] = useState(0.9)
  const [currentStep, setCurrentStep] = useState(0)
  const [showAllSteps, setShowAllSteps] = useState(false)

  useEffect(() => {
    const synth = window.speechSynthesis
    const loadVoices = () => {
      const available = synth.getVoices()
      if (available.length) {
        setVoices(available)
        const preferred = available.find(v => v.lang.includes('en')) || available[0]
        setSelectedVoice(preferred)
      }
    }
    loadVoices()
    if (typeof synth.onvoiceschanged !== 'undefined') {
      synth.onvoiceschanged = loadVoices
    }
  }, [])

  const speak = (text) => {
    if (!text || !selectedVoice) return

    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = selectedVoice
      utterance.lang = selectedVoice.lang
      utterance.rate = rate
      window.speechSynthesis.speak(utterance)
    } catch (err) {
      console.error('🔇 TTS Failed:', err.message)
    }
  }

  const speakFullSolution = () => {
    const spokenScript = solution?.spokenScript
    if (spokenScript) {
      speak(spokenScript)
    }
  }

  const speakStep = (stepText) => {
    speak(stepText)
  }

  const nextStep = () => {
    if (currentStep < solution?.steps?.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex)
    setShowAllSteps(false)
  }

  const toggleShowAll = () => {
    setShowAllSteps(!showAllSteps)
  }

  const formatStepText = (stepText) => {
    // Split by double newlines to create paragraphs/lines
    return stepText.split('\n\n').map((line, index) => (
      <div key={index} className="step-line">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          children={line.trim()}
        />
      </div>
    ))
  }

  if (!solution?.steps?.length) {
    return (
      <div className="solution-output">
        <div className="no-solution">
          <div className="loading-icon">⏳</div>
          <p>Waiting for solution...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="solution-output">
      {/* TTS Settings */}
      <div className="tts-settings">
        <h4>🎧 Audio Settings</h4>
        <div className="tts-controls">
          <div className="tts-control-group">
            <label htmlFor="voice-select">🎙 Voice:</label>
            <select
              id="voice-select"
              value={selectedVoice?.name || ''}
              onChange={(e) =>
                setSelectedVoice(voices.find(v => v.name === e.target.value))
              }
            >
              {voices.map((v, i) => (
                <option key={i} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="tts-control-group">
            <label htmlFor="rate-range">⚡ Speed:</label>
            <input
              id="rate-range"
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
            />
            <span className="speed-value">{rate.toFixed(1)}x</span>
          </div>

          <button 
            onClick={speakFullSolution} 
            className="read-aloud-btn full-solution" 
            disabled={!solution?.spokenScript}
          >
            🔊 Read Complete Solution
          </button>
        </div>
      </div>

      {/* Solution Header */}
      <div className="solution-header">
        <h3>📘 Step-by-Step Solution</h3>
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${!showAllSteps ? 'active' : ''}`}
            onClick={() => setShowAllSteps(false)}
          >
            Step by Step
          </button>
          <button 
            className={`toggle-btn ${showAllSteps ? 'active' : ''}`}
            onClick={toggleShowAll}
          >
            Show All Steps
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="solution-progress">
        <div className="progress-info">
          <span>Step {currentStep + 1} of {solution.steps.length}</span>
          <div className="progress-percentage">
            {Math.round(((currentStep + 1) / solution.steps.length) * 100)}%
          </div>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{width: `${((currentStep + 1) / solution.steps.length) * 100}%`}}
          ></div>
        </div>
      </div>

      {/* Solution Content */}
      {showAllSteps ? (
        // Show All Steps View
        <div className="all-steps-view">
          {solution.steps.map((step, index) => (
            <div key={index} className="solution-step complete">
              <div className="step-header">
                <div className="step-number">
                  <span>{index + 1}</span>
                </div>
                <h4>Step {index + 1}</h4>
                <button 
                  className="speak-step-btn"
                  onClick={() => speakStep(step.text)}
                  title="Read this step aloud"
                >
                  🔊
                </button>
              </div>
              <div className="step-content">
                {formatStepText(step.text)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Step by Step View
        <div className="step-by-step-view">
          {/* Step Navigation Pills */}
          <div className="step-navigation">
            {solution.steps.map((_, index) => (
              <button
                key={index}
                className={`step-pill ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                onClick={() => goToStep(index)}
              >
                {index < currentStep ? '✓' : index + 1}
              </button>
            ))}
          </div>

          {/* Current Step */}
          <div className="current-step">
            <div className="step-header">
              <div className="step-number-large">
                <span>{currentStep + 1}</span>
              </div>
              <div className="step-title-section">
                <h4>Step {currentStep + 1}</h4>
                <button 
                  className="speak-step-btn"
                  onClick={() => speakStep(solution.steps[currentStep]?.text)}
                  title="Read this step aloud"
                >
                  🔊 Read Step
                </button>
              </div>
            </div>

            <div className="step-content-large">
              {formatStepText(solution.steps[currentStep]?.text || '')}
            </div>

            {/* Step Navigation Controls */}
            <div className="step-controls">
              <button 
                className="nav-btn prev-btn"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                ← Previous Step
              </button>
              
              <div className="step-indicator">
                {currentStep + 1} / {solution.steps.length}
              </div>

              {currentStep < solution.steps.length - 1 ? (
                <button 
                  className="nav-btn next-btn"
                  onClick={nextStep}
                >
                  Next Step →
                </button>
              ) : (
                <div className="completion-message">
                  <span className="check-icon">✅</span>
                  Solution Complete!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Proceed to Challenge Button */}
      {onProceedToChallenge && (
        <div className="proceed-section">
          <div className="proceed-message">
            <div className="proceed-icon">🎯</div>
            <div className="proceed-text">
              <h4>Ready for the Challenge?</h4>
              <p>Test your understanding with a practice problem!</p>
            </div>
          </div>
          <button className="proceed-btn" onClick={onProceedToChallenge}>
            <span className="btn-icon">🚀</span>
            Take the Challenge
          </button>
        </div>
      )}
    </div>
  )
}

export default SolutionOutput