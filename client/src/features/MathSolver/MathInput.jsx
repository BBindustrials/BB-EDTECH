import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './MathInput.css';

const MathInput = ({ onSessionData }) => {
  const { t } = useTranslation();

  const [question, setQuestion] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post('/api/math/solve', {
        question,
        level,
      });

      const { steps, challenge, correctAnswer } = res.data;

      onSessionData({ steps }, challenge, correctAnswer);
    } catch (err) {
      console.error("❌ Error solving math:", err);
      alert(t("errorSolving"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="math-input-container">
      <form onSubmit={handleSubmit}>
        <label>{t("enterQuestion")}</label>
        <input
          type="text"
          placeholder="e.g. 4 / (3 * 2)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />

        <label>{t("selectLevel")}</label>
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="Beginner">{t("beginner")}</option>
          <option value="Intermediate">{t("intermediate")}</option>
          <option value="Advanced">{t("advanced")}</option>
        </select>

        <button type="submit" disabled={isLoading}>
          {isLoading ? t("solving") + "..." : t("solve")}
        </button>
      </form>
    </div>
  );
};

export default MathInput;
