import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2pdf from 'html2pdf.js';
import './ChallengeQuestion.css';
import supabase from "../../services/supabaseClient"


const ChallengeQuestion = ({ challenge, correctAnswer, userId }) => {
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [retry, setRetry] = useState(false);

  useEffect(() => {
    if (challenge) {
      setStartTime(Date.now());
      setFeedback(null);
      setUserInput('');
      setRetry(false);
    }
  }, [challenge]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endTime = Date.now();
    const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
    setDuration(timeTaken);

    const isCorrect = userInput.trim() === correctAnswer.trim();

    // Save to Supabase
    await supabase.from('math_challenges').insert({
      user_id: userId,
      challenge,
      user_answer: userInput,
      correct_answer: correctAnswer,
      is_correct: isCorrect,
      time_taken: timeTaken,
      attempted_at: new Date().toISOString()
    });

    setFeedback(isCorrect
      ? `✅ Great job! You got it right in ${timeTaken} seconds.`
      : `❌ Not quite. It took you ${timeTaken} seconds. Try again!`
    );
  };

  const handleExport = () => {
    const element = document.getElementById('challenge-report');
    const opt = {
      margin:       0.5,
      filename:     'Challenge_Report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  return (
    <div className="challenge-container" id="challenge-report">
      <h3>🧠 Your Challenge</h3>
      <p className="challenge-question">{challenge}</p>

      <form onSubmit={handleSubmit}>
        <label>✏️ Your Answer:</label>
        <input
          type="text"
          placeholder="Type your answer here..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          required
        />

        <button type="submit">Submit Answer</button>
      </form>

      {feedback && (
        <div className={`feedback ${feedback.startsWith("✅") ? "correct" : "incorrect"}`}>
          <p>{feedback}</p>
          {!feedback.startsWith("✅") && (
            <button onClick={() => setRetry(true)}>🔄 Try Again</button>
          )}
        </div>
      )}

      {retry && (
        <div className="retry-info">
          <p>Take another shot at it 💪</p>
        </div>
      )}

      {feedback && (
        <div className="export-options">
          <button onClick={handleExport}>📁 Export Report as PDF</button>
        </div>
      )}
    </div>
  );
};

export default ChallengeQuestion;
