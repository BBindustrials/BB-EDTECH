// src/pages/MathSolverPage.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import MathInput from './MathInput';
import SolutionOutput from './SolutionOutput';
import ChallengeQuestion from './ChallengeQuestion';
import { useTranslation } from 'react-i18next';
import './MathSolver.css';

const MathSolver = () => {
  const [solution, setSolution] = useState(null)
  const [challenge, setChallenge] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const { t } = useTranslation()

  const handleSessionData = (solutionSteps, challengeQ, correctVal) => {
    setSolution(solutionSteps)
    setChallenge(challengeQ)
    setCorrectAnswer(correctVal)
  }

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
        <h1>🧮 {t('solveMath')}</h1>
      </header>

      <div className="math-solver">
        <MathInput onSessionData={handleSessionData} />
        {solution && <SolutionOutput solution={solution} />}
        {solution && challenge && (
          <ChallengeQuestion
            challenge={challenge}
            correctAnswer={correctAnswer}
            original={solution.steps}
          />
        )}
      </div>
    </div>
  )
}

export default MathSolver
