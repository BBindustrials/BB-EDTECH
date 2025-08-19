// src/components/IDDHelper.jsx
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import supabase from "../../services/supabaseClient";
import ApiService from "../../services/api.js";
import ErrorBoundary from "../../components/ErrorBoundary";
import "./IDDHelper.css";

/**
 * IDDHelper
 * - Generates individualized lesson plans using ApiService
 * - Stores student profiles & lesson plans in Supabase
 * - Renders Markdown output inside <div className="markdown-body">
 *
 * Props:
 * - onStatsUpdate: optional callback invoked after saves to refresh counts/metrics
 */

const IDDHelper = ({ onStatsUpdate }) => {
  // -----------------------
  // State
  // -----------------------
  const [studentProfile, setStudentProfile] = useState({
    name: "",
    age: "",
    grade: "",
    diagnosis: "",
    communication: "verbal",
    readingLevel: "none",
    mathLevel: "number-sense"
  });

  const [savedProfiles, setSavedProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // -----------------------
  // Effects
  // -----------------------
  useEffect(() => {
    const init = async () => {
      try {
        // Supabase v2: auth.getUser() -> { data: { user }, error }
        const res = await supabase.auth.getUser();
        const currentUser = res?.data?.user || null;
        setUser(currentUser);
        if (currentUser) {
          await loadSavedProfiles(currentUser.id);
          testConnection();
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------
  // Utility / API helpers
  // -----------------------
  const testConnection = async () => {
    try {
      await ApiService.healthCheck();
      console.log("✅ Backend connection successful");
    } catch (err) {
      console.error("❌ Backend connection failed:", err);
    }
  };

  const loadSavedProfiles = async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("idd_student_profiles")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedProfiles(data || []);
    } catch (err) {
      console.error("Error loading profiles:", err);
    }
  };

  const saveProfile = async () => {
    if (!user) {
      alert("No user detected. Please sign in.");
      return;
    }

    if (!studentProfile.name.trim()) {
      alert("Please enter a student name");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      const insertObj = {
        user_id: user.id,
        student_name: studentProfile.name,
        age: studentProfile.age ? parseInt(studentProfile.age, 10) : null,
        grade: studentProfile.grade || null,
        diagnosis: studentProfile.diagnosis || null,
        communication_mode: studentProfile.communication || "verbal",
        reading_level: studentProfile.readingLevel || "none",
        math_level: studentProfile.mathLevel || "number-sense",
        is_active: true
      };

      const { error } = await supabase.from("idd_student_profiles").insert(insertObj);

      if (error) throw error;

      await loadSavedProfiles(user.id);
      alert("Profile saved successfully!");
      if (onStatsUpdate) onStatsUpdate();
    } catch (err) {
      console.error("Error saving profile:", err);
      setErrorMessage("Error saving profile");
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  const loadProfile = (profileId) => {
    if (!profileId) {
      setSelectedProfileId("");
      setStudentProfile({
        name: "",
        age: "",
        grade: "",
        diagnosis: "",
        communication: "verbal",
        readingLevel: "none",
        mathLevel: "number-sense"
      });
      return;
    }

    const profile = savedProfiles.find((p) => String(p.id) === String(profileId));
    if (profile) {
      setSelectedProfileId(profileId);
      setStudentProfile({
        name: profile.student_name || "",
        age: profile.age?.toString() || "",
        grade: profile.grade || "",
        diagnosis: profile.diagnosis || "",
        communication: profile.communication_mode || "verbal",
        readingLevel: profile.reading_level || "none",
        mathLevel: profile.math_level || "number-sense"
      });
    } else {
      // If not found, reset
      setSelectedProfileId("");
    }
  };

  const saveLessonPlan = async (planContent) => {
    if (!user || !planContent) return;
    try {
      const { error } = await supabase.from("idd_lesson_plans").insert({
        user_id: user.id,
        title: `${studentProfile.name || "Student"} - ${topic?.substring(0, 50) || "Lesson Plan"}`,
        curriculum_topic: topic,
        full_plan: planContent,
        student_profile_id: selectedProfileId || null
      });

      if (error) throw error;
      if (onStatsUpdate) onStatsUpdate();
    } catch (err) {
      console.error("Error saving lesson plan:", err);
    }
  };

  // -----------------------
  // Options arrays
  // -----------------------
  const communicationOptions = ["verbal", "limited-speech", "aac", "gestures", "pecs", "points"];
  const readingOptions = ["none", "pre-letter", "letter-recognition", "simple-words", "independent-reader"];
  const mathOptions = ["number-sense", "counting", "simple-operations", "grade-level"];

  // -----------------------
  // Prompt generation & LLM call
  // -----------------------
  const generatePrompt = () => {
    const lines = [
      `Student profile:`,
      `Name: ${studentProfile.name}`,
      `Age: ${studentProfile.age}`,
      `Grade: ${studentProfile.grade}`,
      `Communication: ${studentProfile.communication}`,
      `Reading: ${studentProfile.readingLevel}`,
      `Math: ${studentProfile.mathLevel}`
    ];
    if (studentProfile.diagnosis) lines.push(`Diagnosis: ${studentProfile.diagnosis}`);

    lines.push("", `Curriculum topic: ${topic}`, "", "Create individualized lesson plan with:", "1) SMART objective (Student, behavior, condition, criterion, timeframe)", "2) 10-15 minute script (teacher actions + student responses)", "3) Two scaffolds: Supported (high prompts) & Independent (faded prompts)", "4) 3 formative checks with 0/1/2 scoring", "5) Home practice using household items", "6) Behavior supports & accommodations", "7) Weekly progress monitoring", "", "Keep output concise, actionable, parent-friendly.");

    return lines.join("\n");
  };

  const handleGenerate = async () => {
    if (!topic.trim() || !studentProfile.name.trim()) {
      alert("Please fill in student name and curriculum topic");
      return;
    }

    setLoading(true);
    setResult(null);
    setErrorMessage("");

    try {
      console.log("🎯 Generating lesson plan for:", studentProfile.name);

      const prompt = generatePrompt();

      const data = await ApiService.generateLessonPlan(prompt, {
        userId: user?.id,
        maxTokens: 2500,
        temperature: 0.7
      });

      // Defensive: data might be string or object depending on service
      const completion = typeof data === "string" ? data : data?.completion || data?.text || null;

      if (!completion) {
        throw new Error("No completion returned from API");
      }

      setResult(completion);

      // Auto-save the lesson plan (best-effort)
      await saveLessonPlan(completion);

      console.log("✅ Lesson plan generated successfully");
    } catch (err) {
      console.error("❌ Error generating lesson plan:", err);
      const msg = err?.message || "Unknown error";
      setErrorMessage(msg);
      alert(`Error generating lesson plan: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // Copy / Download helpers
  // -----------------------
  const handleCopy = async () => {
    try {
      const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
      await navigator.clipboard.writeText(text);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    try {
      const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const safeName = (studentProfile.name || "student").replace(/\s+/g, "-").toLowerCase();
      a.download = `lesson-plan-${safeName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download file");
    }
  };

  // -----------------------
  // Input handler
  // -----------------------
  const handleInputChange = (field, value) => {
    setStudentProfile((prev) => ({ ...prev, [field]: value }));
  };

  // -----------------------
  // Render
  // -----------------------
  return (
    <div className="idd-helper-container">
      <div className="idd-helper-wrapper">
        <div className="idd-helper-card idd-fade-in">
          {/* Header */}
          <div className="idd-header">
            <h1 className="idd-title">IDD Helper</h1>
            <p className="idd-subtitle">
              Create individualized lesson plans for students with intellectual and developmental disabilities
            </p>
          </div>

          {/* Main Grid */}
          <div className="idd-main-grid">
            {/* Student Profile */}
            <div className="idd-section">
              <div className="idd-section-header">
                <h2 className="idd-section-title">Student Profile</h2>

                <button
                  onClick={saveProfile}
                  disabled={saving || !studentProfile.name.trim()}
                  className="idd-btn idd-btn-success idd-btn-small"
                >
                  {saving ? "Saving..." : "💾 Save Profile"}
                </button>
              </div>

              {/* Profile selector */}
              {savedProfiles.length > 0 && (
                <div className="idd-profile-selector idd-slide-up">
                  <label className="idd-label">Load Saved Profile</label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => loadProfile(e.target.value)}
                    className="idd-select"
                  >
                    <option value="">Create new profile</option>
                    {savedProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.student_name} ({profile.grade || "No grade"}) -{" "}
                        {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown date"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Basic info rows */}
              <div className="idd-form-row">
                <div className="idd-form-group">
                  <label className="idd-label">Student Name</label>
                  <input
                    type="text"
                    value={studentProfile.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="idd-input idd-focus-visible"
                    placeholder="Enter student name"
                  />
                </div>

                <div className="idd-form-group">
                  <label className="idd-label">Age</label>
                  <input
                    type="number"
                    value={studentProfile.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    className="idd-input idd-focus-visible"
                    placeholder="Age"
                    min="3"
                    max="25"
                  />
                </div>
              </div>

              <div className="idd-form-row">
                <div className="idd-form-group">
                  <label className="idd-label">Grade Level</label>
                  <input
                    type="text"
                    value={studentProfile.grade}
                    onChange={(e) => handleInputChange("grade", e.target.value)}
                    className="idd-input idd-focus-visible"
                    placeholder="e.g., K, 1st, 2nd, etc."
                  />
                </div>

                <div className="idd-form-group">
                  <label className="idd-label">Communication Mode</label>
                  <select
                    value={studentProfile.communication}
                    onChange={(e) => handleInputChange("communication", e.target.value)}
                    className="idd-select idd-focus-visible"
                  >
                    {communicationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="idd-form-row">
                <div className="idd-form-group">
                  <label className="idd-label">Reading Level</label>
                  <select
                    value={studentProfile.readingLevel}
                    onChange={(e) => handleInputChange("readingLevel", e.target.value)}
                    className="idd-select idd-focus-visible"
                  >
                    {readingOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="idd-form-group">
                  <label className="idd-label">Math Level</label>
                  <select
                    value={studentProfile.mathLevel}
                    onChange={(e) => handleInputChange("mathLevel", e.target.value)}
                    className="idd-select idd-focus-visible"
                  >
                    {mathOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="idd-form-group">
                <label className="idd-label">Diagnosis (Optional)</label>
                <input
                  type="text"
                  value={studentProfile.diagnosis}
                  onChange={(e) => handleInputChange("diagnosis", e.target.value)}
                  className="idd-input idd-focus-visible"
                  placeholder="e.g., Down syndrome, ASD, intellectual disability"
                />
              </div>
            </div>

            {/* Lesson Planning */}
            <div className="idd-section lesson-planning">
              <div className="idd-section-header">
                <h2 className="idd-section-title">Lesson Planning</h2>
                {studentProfile.name && (
                  <div className="idd-status-indicator idd-status-success">
                    <span>✓</span> Profile Ready
                  </div>
                )}
              </div>

              <div className="idd-form-group">
                <label className="idd-label">Curriculum Topic</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="idd-textarea idd-focus-visible"
                  placeholder={`Describe the learning objective or skill you want to teach. Examples:
• Counting objects from 1-10
• Reading CVC words (cat, dog, run)
• Identifying basic shapes and colors
• Following 2-step instructions
• Basic addition with manipulatives`}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim() || !studentProfile.name.trim()}
                className="idd-btn idd-btn-primary idd-focus-visible"
              >
                {loading ? (
                  <>
                    <div className="idd-spinner" />
                    Generating Lesson Plan...
                  </>
                ) : (
                  <>🎯 Generate Individualized Lesson Plan</>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          {errorMessage && (
            <div className="idd-error">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}

          {result && (
            <div className="idd-results idd-fade-in">
              <div className="idd-results-header">
                <h2>Generated Lesson Plan</h2>
              </div>

              <div className="idd-results-content idd-card-hover">
                <ErrorBoundary>
                  {/* Wrapper requested by you */}
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
                    </ReactMarkdown>
                  </div>
                </ErrorBoundary>
              </div>

              <div className="idd-results-actions">
                <button
                  onClick={handleCopy}
                  className="idd-action-btn idd-action-btn-copy idd-focus-visible"
                >
                  {showCopySuccess ? (
                    <>
                      <span>✓</span> Copied!
                    </>
                  ) : (
                    <>
                      <span>📋</span> Copy to Clipboard
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="idd-action-btn idd-action-btn-download idd-focus-visible"
                >
                  <span>💾</span> Download Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IDDHelper;
