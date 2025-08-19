import React, { useState, useEffect, useRef } from "react"
import supabase from "../../services/supabaseClient"
import styles from "../../styles/ConfusionSolverForm.module.css"
import { marked } from "marked"
import hljs from "highlight.js"
import "highlight.js/styles/github.css"

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
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    concept: "",
    areaofstudy: "",
    level: "Undergraduate",
    country: "",
    stateorregion: "",
    keywords: ""
  })

  const [response, setResponse] = useState("")
  const [followUpInput, setFollowUpInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [recentConcepts, setRecentConcepts] = useState([])
  const [conceptSuggestions, setConceptSuggestions] = useState([])
  const [keywordSuggestions, setKeywordSuggestions] = useState([])
  const [draftSaved, setDraftSaved] = useState(false)
  const chatContainerRef = useRef(null)

  // Subject-specific concept banks
  const conceptBanks = {
    Mathematics: ["Calculus", "Linear Algebra", "Statistics", "Probability", "Derivatives", "Integrals"],
    Physics: ["Quantum Mechanics", "Thermodynamics", "Electromagnetism", "Relativity", "Wave Motion"],
    Economics: ["Supply and Demand", "Market Equilibrium", "Opportunity Cost", "Elasticity", "GDP"],
    Chemistry: ["Chemical Bonding", "Organic Reactions", "Thermochemistry", "Kinetics", "Equilibrium"],
    Biology: ["Evolution", "Genetics", "Cellular Respiration", "Photosynthesis", "Ecology"],
    "Computer Science": ["Algorithms", "Data Structures", "Machine Learning", "Databases", "Networks"]
  }

  // Countries with regions for better UX
  const countryRegions = {
    Nigeria: ["Lagos", "Abuja", "Kano", "Rivers", "Oyo", "Delta", "Kaduna"],
    Kenya: ["Nairobi", "Mombasa", "Nakuru", "Eldoret", "Kisumu", "Thika"],
    Ghana: ["Accra", "Kumasi", "Tamale", "Cape Coast", "Sunyani"],
    "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth"],
    India: ["Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Gujarat", "Punjab"]
  }

  useEffect(() => {
    loadRecentConcepts()
    loadDraft()
  }, [])

  useEffect(() => {
    if (formData.areaofstudy && conceptBanks[formData.areaofstudy]) {
      setConceptSuggestions(conceptBanks[formData.areaofstudy])
    }
  }, [formData.areaofstudy])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [conversationHistory])

  const loadRecentConcepts = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        const { data } = await supabase
          .from("confusion_solver")
          .select("concept, areaofstudy, created_at")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false })
          .limit(5)
        
        if (data) setRecentConcepts(data)
      }
    } catch (error) {
      console.log("Could not load recent concepts:", error)
    }
  }

  const saveDraft = () => {
    localStorage.setItem('bb_edtech_draft', JSON.stringify({
      ...formData,
      step: currentStep,
      timestamp: Date.now()
    }))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
  }

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('bb_edtech_draft')
      if (draft) {
        const parsed = JSON.parse(draft)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
          setFormData(parsed)
          setCurrentStep(parsed.step || 1)
        }
      }
    } catch (error) {
      console.log("Could not load draft:", error)
    }
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    saveDraft()
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const validateStep = (step) => {
    switch (step) {
      case 1: return formData.concept.trim() !== ""
      case 2: return formData.areaofstudy.trim() !== "" && formData.level !== ""
      case 3: return formData.country.trim() !== "" && formData.stateorregion.trim() !== ""
      default: return true
    }
  }

  const getStepTitle = (step) => {
    const titles = {
      1: "🧠 What's Confusing You?",
      2: "📚 Academic Context",
      3: "🌍 Your Location",
      4: "🎯 Final Review"
    }
    return titles[step]
  }

  const fillFromRecent = (recentConcept) => {
    setFormData({
      ...formData,
      concept: recentConcept.concept,
      areaofstudy: recentConcept.areaofstudy
    })
  }

  const exportChat = () => {
    const chatText = conversationHistory.map((entry, index) => 
      `[${index + 1}] You: ${entry.user}\n    AI: ${entry.ai}\n`
    ).join('\n')
    
    const element = document.createElement('a')
    const file = new Blob([chatText], {type: 'text/plain'})
    element.href = URL.createObjectURL(file)
    element.download = `bb-edtech-conversation-${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResponse("")

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        throw new Error("Please sign in to use the confusion solver.")
      }

      const user_id = userData.user.id
      const { concept, areaofstudy, level, country, stateorregion, keywords } = formData

      const newData = {
        user_id,
        concept,
        areaofstudy,
        level,
        country,
        stateorregion,
        keywords: keywords.split(',').map(k => k.trim()),
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
      setResponse(aiText)

      const firstPrompt = `Concept: ${concept} | Area: ${areaofstudy}`
      if (typeof onFollowUp === 'function') {
        onFollowUp({ user: firstPrompt, ai: aiText })
      }
      if (typeof setInitialPrompt === 'function') {
        setInitialPrompt(firstPrompt)
      }

      // Clear draft after successful submission
      localStorage.removeItem('bb_edtech_draft')

    } catch (err) {
      setError(err.message || "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleFollowUpSubmit = async () => {
    if (!followUpInput.trim()) return

    setLoading(true)
    setError("")

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
          keywords: formData.keywords.split(',').map(k => k.trim())
        })
      })

      if (!res.ok) {
        throw new Error(`Follow-up failed: ${res.status}`)
      }

      const result = await res.json()
      const followUpResponse = result.response || result.content || "AI followed up."

      if (typeof onFollowUp === 'function') {
        onFollowUp({ user: followUpInput, ai: followUpResponse })
      }
      setFollowUpInput("")
    } catch (err) {
      setError(err.message || "Error during follow-up")
    } finally {
      setLoading(false)
    }
  }

  const renderProgressBar = () => (
    <div className={styles.progressContainer}>
      <div className={styles.progressBar}>
        {[1, 2, 3, 4].map(step => (
          <div 
            key={step}
            className={`${styles.progressStep} ${currentStep >= step ? styles.completed : ''} ${currentStep === step ? styles.active : ''}`}
          >
            <div className={styles.stepNumber}>{step}</div>
            <div className={styles.stepLabel}>{getStepTitle(step)}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h3>{getStepTitle(1)}</h3>
              <p>Don't worry - every expert was once a beginner! 🌱</p>
            </div>
            
            {recentConcepts.length > 0 && (
              <div className={styles.recentConcepts}>
                <h4>📚 Recent Concepts</h4>
                <div className={styles.conceptChips}>
                  {recentConcepts.map((recent, index) => (
                    <button
                      key={index}
                      onClick={() => fillFromRecent(recent)}
                      className={styles.conceptChip}
                    >
                      {recent.concept}
                      <span className={styles.chipSubject}>{recent.areaofstudy}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className={styles.label}>🧠 What specific concept or topic confuses you?</label>
            <textarea
              value={formData.concept}
              onChange={(e) => handleChange("concept", e.target.value)}
              className={`${styles.input} ${styles.conceptInput}`}
              placeholder="Be specific! E.g., 'Why does entropy always increase?' or 'How does compound interest work?'"
              rows={4}
              required
            />
            
            <div className={styles.inputHelper}>
              💡 <strong>Tip:</strong> The more specific you are, the better I can help you understand!
            </div>
          </div>
        )

      case 2:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h3>{getStepTitle(2)}</h3>
              <p>Help me tailor the explanation to your academic level 🎓</p>
            </div>

            <label className={styles.label}>📘 Subject or area of study</label>
            <input
              list="subjects"
              value={formData.areaofstudy}
              onChange={(e) => handleChange("areaofstudy", e.target.value)}
              className={styles.input}
              placeholder="e.g., Mathematics, Physics, Economics..."
              required
            />
            <datalist id="subjects">
              {Object.keys(conceptBanks).map(subject => (
                <option key={subject} value={subject} />
              ))}
            </datalist>

            {conceptSuggestions.length > 0 && (
              <div className={styles.suggestions}>
                <p>💡 Popular {formData.areaofstudy} concepts:</p>
                <div className={styles.suggestionChips}>
                  {conceptSuggestions.map(concept => (
                    <button
                      key={concept}
                      onClick={() => handleChange("concept", concept)}
                      className={styles.suggestionChip}
                    >
                      {concept}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className={styles.label}>🎓 Academic level</label>
            <div className={styles.levelCards}>
              {["Secondary School", "Undergraduate", "Postgraduate", "Professional", "Researcher"].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleChange("level", level)}
                  className={`${styles.levelCard} ${formData.level === level ? styles.selected : ''}`}
                >
                  <div className={styles.levelTitle}>{level}</div>
                  <div className={styles.levelDesc}>
                    {level === "Secondary School" && "High school level explanations"}
                    {level === "Undergraduate" && "College-level depth"}
                    {level === "Postgraduate" && "Advanced academic concepts"}
                    {level === "Professional" && "Industry applications"}
                    {level === "Researcher" && "Expert-level analysis"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h3>{getStepTitle(3)}</h3>
              <p>I'll use local examples and analogies to make concepts relatable 🌍</p>
            </div>

            <label className={styles.label}>🌍 Country</label>
            <input
              list="countries"
              value={formData.country}
              onChange={(e) => handleChange("country", e.target.value)}
              className={styles.input}
              placeholder="e.g., Nigeria, Kenya, Ghana..."
              required
            />
            <datalist id="countries">
              {Object.keys(countryRegions).map(country => (
                <option key={country} value={country} />
              ))}
            </datalist>

            <label className={styles.label}>📍 State or Region</label>
            <input
              list="regions"
              value={formData.stateorregion}
              onChange={(e) => handleChange("stateorregion", e.target.value)}
              className={styles.input}
              placeholder="e.g., Lagos, Nairobi, Accra..."
              required
            />
            <datalist id="regions">
              {formData.country && countryRegions[formData.country]?.map(region => (
                <option key={region} value={region} />
              ))}
            </datalist>

            <div className={styles.cultureNote}>
              🎯 <strong>Cultural Learning:</strong> I'll use examples from your region to make concepts more relatable and memorable!
            </div>
          </div>
        )

      case 4:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h3>{getStepTitle(4)}</h3>
              <p>Everything looks good! Let's get you the perfect explanation 🎯</p>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>🧠 Concept:</span>
                <span className={styles.reviewValue}>{formData.concept}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>📘 Subject:</span>
                <span className={styles.reviewValue}>{formData.areaofstudy}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>🎓 Level:</span>
                <span className={styles.reviewValue}>{formData.level}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>🌍 Location:</span>
                <span className={styles.reviewValue}>{formData.country}, {formData.stateorregion}</span>
              </div>
            </div>

            <label className={styles.label}>🔑 Additional keywords (optional)</label>
            <input
              value={formData.keywords}
              onChange={(e) => handleChange("keywords", e.target.value)}
              className={styles.input}
              placeholder="e.g., practical examples, step-by-step, visual"
            />

            <div className={styles.finalNote}>
              ✨ <strong>Ready to learn?</strong> I'll create a personalized explanation with local analogies and culturally relevant examples!
            </div>
          </div>
        )
    }
  }

  return (
    <div className={styles.container}>
      

      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h2 className={styles.heading}>🧩 BB EDTECH.AI CONFUSION SOLVER</h2>
          <p className={styles.subtitle}>Let's break down complex concepts together!</p>
        </div>

        {renderProgressBar()}

        <form onSubmit={handleSubmit} className={styles.form}>
          {renderStep()}

          <div className={styles.navigationButtons}>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className={styles.navButton}
              >
                ⬅ Previous
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className={`${styles.navButton} ${styles.primary}`}
                disabled={!validateStep(currentStep)}
              >
                Next ➡
              </button>
            ) : (
              <button
                type="submit"
                className={`${styles.submitButton} ${loading ? styles.loading : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Creating explanation...
                  </>
                ) : (
                  "🚀 Get My Explanation!"
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Chat Interface */}
      {(Array.isArray(conversationHistory) && conversationHistory.length > 0) && (
        <div className={styles.chatSection}>
          <div className={styles.chatHeader}>
            <h3>💬 Conversation</h3>
            <button onClick={exportChat} className={styles.exportButton}>
              📥 Export Chat
            </button>
          </div>
          
          <div className={styles.chatContainer} ref={chatContainerRef}>
            {conversationHistory.map((entry, index) => (
              <div key={index} className={styles.chatPair}>
                <div className={styles.userBubble}>
                  <div className={styles.bubbleContent}>{entry.user}</div>
                  <div className={styles.bubbleTime}>You</div>
                </div>
                <div className={styles.aiBubble}>
                  <div 
                    className={styles.bubbleContent}
                    dangerouslySetInnerHTML={{ __html: marked.parse(entry.ai) }}
                  />
                  <div className={styles.bubbleTime}>BB AI</div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.followUpSection}>
            <div className={styles.followUpInput}>
              <textarea
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                placeholder="Ask a follow-up question... 🤔"
                className={styles.followUpTextarea}
                rows={2}
              />
              <button
                onClick={handleFollowUpSubmit}
                className={styles.followUpButton}
                disabled={loading || !followUpInput.trim()}
              >
                {loading ? "🤔" : "📨"}
              </button>
            </div>
            <div className={styles.followUpHints}>
              💡 Try: "Can you give more examples?" • "Explain it simpler" • "How is this used in real life?"
            </div>
          </div>
        </div>
      )}

      {response && !conversationHistory.length && (
        <div className={styles.responseSection}>
          <div className={styles.responseHeader}>
            <h3>✅ Your Personalized Explanation</h3>
          </div>
          <div
            className={styles.aiResponse}
            dangerouslySetInnerHTML={{ __html: marked.parse(response) }}
          />
        </div>
      )}

      {error && (
        <div className={styles.errorSection}>
          <div className={styles.errorContent}>
            <span className={styles.errorIcon}>⚠️</span>
            <span className={styles.errorText}>{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfusionSolverForm