import React, { useState, useEffect, useRef } from "react"
import supabase from "../../services/supabaseClient"
import styles from "../../styles/ConfusionSolverForm.module.css"
import { marked } from "marked"
import hljs from "highlight.js"
import "highlight.js/styles/github-dark.css"

marked.setOptions({
  breaks: true,
  highlight: function (code, lang) {
    return hljs.highlightAuto(code, [lang]).value
  }
})

const ConfusionSolverForm = ({
  onBack = () => {},
  onFollowUp = () => {},
  conversationHistory = [],
  initialPrompt = "",
  setInitialPrompt = () => {}
}) => {
  const [formData, setFormData] = useState({
    concept: "",
    areaofstudy: "",
    level: "Undergraduate",
    country: "",
    stateorregion: "",
    keywords: "",
    learningStyle: "Visual",
    complexity: "Moderate"
  })

  const [response, setResponse] = useState("")
  const [followUpInput, setFollowUpInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [savedConcepts, setSavedConcepts] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [difficulty, setDifficulty] = useState(3)
  const [isTyping, setIsTyping] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const chatEndRef = useRef(null)
  const conceptInputRef = useRef(null)

  // Sample concept suggestions based on area of study
  const conceptSuggestions = {
    "Mathematics": ["Calculus derivatives", "Linear algebra", "Probability distributions", "Complex numbers"],
    "Physics": ["Quantum mechanics", "Thermodynamics", "Electromagnetic fields", "Relativity theory"],
    "Economics": ["Supply and demand", "Market equilibrium", "Opportunity cost", "Game theory"],
    "Computer Science": ["Algorithm complexity", "Data structures", "Machine learning", "Blockchain"],
    "Chemistry": ["Chemical bonding", "Reaction kinetics", "Organic synthesis", "Molecular orbitals"],
    "Biology": ["DNA replication", "Photosynthesis", "Cell division", "Evolution theory"]
  }

  const countries = [
    "Nigeria", "Kenya", "Ghana", "South Africa", "Egypt", "Morocco", "India", "Pakistan", 
    "Bangladesh", "Indonesia", "Malaysia", "Philippines", "Brazil", "Mexico", "Colombia"
  ]

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory, response])

  useEffect(() => {
    loadSavedConcepts()
  }, [])

  // Auto-save form data to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('bb-edtech-form-draft', JSON.stringify(formData))
    }, 1000)
    return () => clearTimeout(timeoutId)
  }, [formData])

  // Load saved concepts from user's history
  const loadSavedConcepts = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        const { data } = await supabase
          .from("confusion_solver")
          .select("concept, areaofstudy")
          .eq("user_id", userData.user.id)
          .limit(5)
          .order("created_at", { ascending: false })
        
        if (data) setSavedConcepts(data)
      }
    } catch (err) {
      console.error("Error loading saved concepts:", err)
    }
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    
    // Show suggestions when area of study changes
    if (field === 'areaofstudy' && conceptSuggestions[value]) {
      setShowSuggestions(true)
    }
  }

  const selectSuggestion = (suggestion) => {
    setFormData({ ...formData, concept: suggestion })
    setShowSuggestions(false)
    conceptInputRef.current?.focus()
  }

  const validateStep = (step) => {
    switch(step) {
      case 1:
        return formData.concept.trim().length >= 3
      case 2:
        return formData.areaofstudy.trim().length >= 2
      case 3:
        return formData.country.trim().length >= 2 && formData.stateorregion.trim().length >= 2
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1)
      setProgress((currentStep / 4) * 100)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setProgress(((currentStep - 2) / 4) * 100)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResponse("")
    setIsTyping(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        throw new Error("Please sign in to use the confusion solver.")
      }

      const user_id = userData.user.id
      const { concept, areaofstudy, level, country, stateorregion, keywords, learningStyle, complexity } = formData

      const newData = {
        user_id,
        concept,
        areaofstudy,
        level,
        country,
        stateorregion,
        keywords: keywords.split(',').map(k => k.trim()),
        learning_style: learningStyle,
        complexity_level: complexity,
        difficulty_rating: difficulty,
        created_at: new Date().toISOString()
      }

      const { data: savedData, error: supabaseError } = await supabase
        .from("confusion_solver")
        .insert([newData])
        .select()
        .single()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      const res = await fetch("/api/confusion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savedData)
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Backend error: ${res.status} - ${errorText}`)
      }

      const result = await res.json()
      const aiText = result.response || result.content || "AI response received but empty."
      
      // Simulate typing effect
      await simulateTyping(aiText)
      
      const firstPrompt = `${concept} (${areaofstudy})`
      if (typeof onFollowUp === 'function') {
        onFollowUp({ user: firstPrompt, ai: aiText })
      }
      if (typeof setInitialPrompt === 'function') {
        setInitialPrompt(firstPrompt)
      }

      // Update saved concepts
      loadSavedConcepts()

    } catch (err) {
      setError(err.message || "Unknown error occurred")
    } finally {
      setLoading(false)
      setIsTyping(false)
    }
  }

  const simulateTyping = async (text) => {
    setResponse("")
    const words = text.split(' ')
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50))
      setResponse(words.slice(0, i + 1).join(' '))
    }
  }

  const handleFollowUpSubmit = async () => {
    if (!followUpInput.trim()) return

    setLoading(true)
    setError("")
    setIsTyping(true)

    try {
      const res = await fetch("/api/confusion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: followUpInput,
          areaofstudy: formData.areaofstudy,
          level: formData.level,
          country: formData.country,
          stateorregion: formData.stateorregion,
          keywords: formData.keywords.split(',').map(k => k.trim()),
          learning_style: formData.learningStyle,
          complexity_level: formData.complexity,
          difficulty_rating: difficulty
        })
      })

      if (!res.ok) {
        throw new Error(`Follow-up failed: ${res.status}`)
      }

      const result = await res.json()
      const followUpResponse = result.response || result.content || "AI followed up."

      await simulateTyping(followUpResponse)

      if (typeof onFollowUp === 'function') {
        onFollowUp({ user: followUpInput, ai: followUpResponse })
      }
      setFollowUpInput("")
    } catch (err) {
      setError(err.message || "Error during follow-up")
    } finally {
      setLoading(false)
      setIsTyping(false)
    }
  }

  const exportChat = () => {
    const chatText = conversationHistory.map(entry => 
      `Q: ${entry.user}\n\nA: ${entry.ai}\n\n---\n\n`
    ).join('')
    
    const blob = new Blob([chatText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bb-edtech-${formData.concept.replace(/\s+/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearForm = () => {
    setFormData({
      concept: "",
      areaofstudy: "",
      level: "Undergraduate",
      country: "",
      stateorregion: "",
      keywords: "",
      learningStyle: "Visual",
      complexity: "Moderate"
    })
    setCurrentStep(1)
    setProgress(0)
    localStorage.removeItem('bb-edtech-form-draft')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Dashboard
        </button>
        <div className={styles.headerActions}>
          <button onClick={clearForm} className={styles.clearButton}>
            🗑️ Clear Form
          </button>
          {conversationHistory.length > 0 && (
            <button onClick={exportChat} className={styles.exportButton}>
              💾 Export Chat
            </button>
          )}
        </div>
      </div>

      <div className={styles.heroSection}>
        <h1 className={styles.title}>🧩 Concept Confusion Solver</h1>
        <p className={styles.subtitle}>
          Transform complex concepts into clear understanding with AI-powered explanations 
          tailored to your cultural context and learning style.
        </p>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.progressText}>Step {currentStep} of 4</span>
      </div>

      {/* Multi-step Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Step 1: Concept Input */}
        {currentStep === 1 && (
          <div className={styles.step}>
            <h3 className={styles.stepTitle}>🎯 What concept confuses you?</h3>
            <div className={styles.inputGroup}>
              <textarea
                ref={conceptInputRef}
                value={formData.concept}
                onChange={(e) => handleChange("concept", e.target.value)}
                className={styles.input}
                placeholder="e.g., How does photosynthesis actually convert light into energy? I understand the basic equation but not the detailed mechanism..."
                rows={4}
                required
              />
              <div className={styles.inputHint}>
                💡 Be specific about what part confuses you most
              </div>
            </div>

            {/* Recent concepts */}
            {savedConcepts.length > 0 && (
              <div className={styles.recentConcepts}>
                <h4>📚 Your Recent Topics:</h4>
                <div className={styles.conceptChips}>
                  {savedConcepts.map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectSuggestion(item.concept)}
                      className={styles.conceptChip}
                    >
                      {item.concept} <span>({item.areaofstudy})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Subject and Learning Preferences */}
        {currentStep === 2 && (
          <div className={styles.step}>
            <h3 className={styles.stepTitle}>📚 Subject & Learning Style</h3>
            
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Subject Area</label>
                <input
                  value={formData.areaofstudy}
                  onChange={(e) => handleChange("areaofstudy", e.target.value)}
                  className={styles.input}
                  placeholder="e.g., Biology, Physics, Economics..."
                  list="subjects"
                  required
                />
                <datalist id="subjects">
                  {Object.keys(conceptSuggestions).map(subject => (
                    <option key={subject} value={subject} />
                  ))}
                </datalist>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Academic Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => handleChange("level", e.target.value)}
                  className={styles.select}
                >
                  <option value="Secondary School">🎒 Secondary School</option>
                  <option value="Undergraduate">🎓 Undergraduate</option>
                  <option value="Postgraduate">👨‍🎓 Postgraduate</option>
                  <option value="Professional">💼 Professional</option>
                  <option value="Researcher">🔬 Researcher</option>
                </select>
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Learning Style</label>
                <select
                  value={formData.learningStyle}
                  onChange={(e) => handleChange("learningStyle", e.target.value)}
                  className={styles.select}
                >
                  <option value="Visual">👁️ Visual (diagrams, charts)</option>
                  <option value="Auditory">👂 Auditory (stories, analogies)</option>
                  <option value="Kinesthetic">✋ Hands-on (examples, practice)</option>
                  <option value="Reading">📖 Reading/Writing (detailed text)</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Explanation Complexity</label>
                <select
                  value={formData.complexity}
                  onChange={(e) => handleChange("complexity", e.target.value)}
                  className={styles.select}
                >
                  <option value="Simple">🌱 Simple (basic terms)</option>
                  <option value="Moderate">🌿 Moderate (some technical terms)</option>
                  <option value="Advanced">🌳 Advanced (technical detail)</option>
                  <option value="Expert">🔬 Expert (comprehensive analysis)</option>
                </select>
              </div>
            </div>

            {/* Concept suggestions */}
            {showSuggestions && conceptSuggestions[formData.areaofstudy] && (
              <div className={styles.suggestions}>
                <h4>💡 Popular concepts in {formData.areaofstudy}:</h4>
                <div className={styles.suggestionChips}>
                  {conceptSuggestions[formData.areaofstudy].map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectSuggestion(suggestion)}
                      className={styles.suggestionChip}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Location & Cultural Context */}
        {currentStep === 3 && (
          <div className={styles.step}>
            <h3 className={styles.stepTitle}>🌍 Your Location & Context</h3>
            
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Country</label>
                <input
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  className={styles.input}
                  placeholder="Select your country..."
                  list="countries"
                  required
                />
                <datalist id="countries">
                  {countries.map(country => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>State/Region</label>
                <input
                  value={formData.stateorregion}
                  onChange={(e) => handleChange("stateorregion", e.target.value)}
                  className={styles.input}
                  placeholder="e.g., Lagos, Punjab, São Paulo..."
                  required
                />
              </div>
            </div>

            <div className={styles.culturalNote}>
              <div className={styles.noteIcon}>🎭</div>
              <div>
                <h4>Why location matters:</h4>
                <p>We use local examples, cultural references, and familiar contexts to make concepts more relatable and easier to understand.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Final Details */}
        {currentStep === 4 && (
          <div className={styles.step}>
            <h3 className={styles.stepTitle}>🔧 Fine-tuning</h3>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Keywords or specific areas to focus on (optional)
              </label>
              <input
                value={formData.keywords}
                onChange={(e) => handleChange("keywords", e.target.value)}
                className={styles.input}
                placeholder="e.g., equations, real-world applications, historical context"
              />
            </div>

            <div className={styles.difficultySlider}>
              <label className={styles.label}>
                Current difficulty level: {difficulty}/5 
                {difficulty <= 2 ? " 😊 Easy" : difficulty <= 4 ? " 🤔 Moderate" : " 😵 Very Hard"}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                className={styles.slider}
              />
            </div>

            <div className={styles.summary}>
              <h4>📋 Summary:</h4>
              <div className={styles.summaryItem}>
                <strong>Concept:</strong> {formData.concept || "Not specified"}
              </div>
              <div className={styles.summaryItem}>
                <strong>Subject:</strong> {formData.areaofstudy || "Not specified"} ({formData.level})
              </div>
              <div className={styles.summaryItem}>
                <strong>Location:</strong> {formData.stateorregion || "Not specified"}, {formData.country || "Not specified"}
              </div>
              <div className={styles.summaryItem}>
                <strong>Style:</strong> {formData.learningStyle} learning, {formData.complexity} complexity
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className={styles.navigation}>
          {currentStep > 1 && (
            <button type="button" onClick={prevStep} className={styles.navButton}>
              ← Previous
            </button>
          )}
          
          {currentStep < 4 ? (
            <button 
              type="button" 
              onClick={nextStep} 
              className={styles.navButton}
              disabled={!validateStep(currentStep)}
            >
              Next →
            </button>
          ) : (
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Generating explanation...
                </>
              ) : (
                "🚀 Generate Explanation"
              )}
            </button>
          )}
        </div>
      </form>

      {/* Chat Interface */}
      {(conversationHistory.length > 0 || response) && (
        <div className={styles.chatSection}>
          <h3 className={styles.chatTitle}>💬 Your Learning Conversation</h3>
          
          <div className={styles.chatContainer}>
            {conversationHistory.map((entry, index) => (
              <div key={index} className={styles.chatPair}>
                <div className={styles.chatUser}>
                  <div className={styles.messageHeader}>
                    <span className={styles.messageLabel}>You asked:</span>
                  </div>
                  <div className={styles.messageContent}>{entry.user}</div>
                </div>
                <div className={styles.chatAI}>
                  <div className={styles.messageHeader}>
                    <span className={styles.messageLabel}>BB EDtech AI:</span>
                    <span className={styles.messageTime}>
                      {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div 
                    className={styles.messageContent}
                    dangerouslySetInnerHTML={{ __html: marked.parse(entry.ai) }}
                  />
                </div>
              </div>
            ))}

            {response && (
              <div className={styles.chatPair}>
                <div className={styles.chatAI}>
                  <div className={styles.messageHeader}>
                    <span className={styles.messageLabel}>
                      BB EDtech AI: 
                      {isTyping && <span className={styles.typingIndicator}>typing...</span>}
                    </span>
                  </div>
                  <div 
                    className={styles.messageContent}
                    dangerouslySetInnerHTML={{ __html: marked.parse(response) }}
                  />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Follow-up Input */}
          <div className={styles.followUpContainer}>
            <div className={styles.followUpInputGroup}>
              <textarea
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                placeholder="Ask a follow-up question, request examples, or clarify anything..."
                className={styles.followUpInput}
                rows={3}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleFollowUpSubmit()
                  }
                }}
              />
              <button
                onClick={handleFollowUpSubmit}
                className={styles.followUpButton}
                disabled={loading || !followUpInput.trim()}
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
            <div className={styles.followUpHint}>
              💡 Try: "Give me a real-world example" • "Explain like I'm 10" • "Show me the math"
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorContent}>
            <h4>Oops! Something went wrong</h4>
            <p>{error}</p>
            <button onClick={() => setError("")} className={styles.errorDismiss}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfusionSolverForm