import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getDailyQuote, getQuotePhase } from './quotes';
import './Dashboard.css';

export default function Dashboard() {
  const [currentQuote, setCurrentQuote] = useState('');
  const [quotePhase, setQuotePhase] = useState('');
  const [isQuoteVisible, setIsQuoteVisible] = useState(false);

  useEffect(() => {
    // Load daily quote and phase
    setCurrentQuote(getDailyQuote());
    setQuotePhase(getQuotePhase());
    
    // Fade in the quote after component mounts
    setTimeout(() => setIsQuoteVisible(true), 500);
  }, []);

  return (
    <div className="dashboard-wrapper">


      {/* Welcome section */}
      <section className="welcome-section">
        <div className="welcome-content">
          <h1 className="welcome-title">WELCOME TO BB EDTECH.AI</h1>
          <p className="welcome-subtext">
            <em>Your AI-powered academic assistant—clear, relatable, and always ready.</em>
          </p>
        </div>

        {/* Feature buttons */}
        <div className="features-container">
          <Link to="/confusion-solver" className="feature-button confusion-solver">
            <div className="button-icon">🧠</div>
            <div className="button-content">
              <span className="button-title">Confusion Solver</span>
              <span className="button-subtitle">Clear your doubts instantly</span>
            </div>
          </Link>
          
          <Link to="/socratic-tutor" className="feature-button socratic-tutor">
            <div className="button-icon">📘</div>
            <div className="button-content">
              <span className="button-title">Socratic Tutor</span>
              <span className="button-subtitle">Learn through guided questions</span>
            </div>
          </Link>
          
          <Link to="/adaptive-tutor" className="feature-button adaptive-tutor">
            <div className="button-icon">📊</div>
            <div className="button-content">
              <span className="button-title">Adaptive Tutor</span>
              <span className="button-subtitle">Personalized learning paths</span>
            </div>
          </Link>
          
          <Link to="/math-solver" className="feature-button math-solver">
            <div className="button-icon">🧮</div>
            <div className="button-content">
              <span className="button-title">Math Solver</span>
              <span className="button-subtitle">Step-by-step solutions</span>
            </div>
          </Link>
          
          <Link to="/idd-helper" className="feature-button idd-helper">
            <div className="button-icon">🆔</div>
            <div className="button-content">
              <span className="button-title">ID Helper</span>
              <span className="button-subtitle">Academic assistance tools</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Daily Quote Section - Moved here */}
      <section className={`daily-quote-section ${isQuoteVisible ? 'visible' : ''}`}>
        <div className="quote-container">
          <div className="quote-badge">
            <span className="quote-phase">{quotePhase}</span>
            <span className="quote-label">Daily Quote</span>
          </div>
          <blockquote className="daily-quote">
            "{currentQuote}"
          </blockquote>
          <div className="quote-decoration">
            <div className="quote-line"></div>
            <div className="quote-icon">💡</div>
            <div className="quote-line"></div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="section-header">
          <h2 className="benefits-title">WHY CHOOSE BB EDTECH.AI?</h2>
          <div className="title-underline"></div>
        </div>
        
        <div className="benefits-grid">
          <div className="benefit-box concepts">
            <div className="benefit-icon-wrapper">
              <div className="benefit-icon">📚</div>
            </div>
            <h3 className="benefit-heading">Concepts Made Simple</h3>
            <p className="benefit-text">
              <em>We break down complex topics—like math and finance—into relatable, step-by-step explanations using culturally relevant examples.</em>
            </p>
            <div className="benefit-accent"></div>
          </div>

          <div className="benefit-box personalized">
            <div className="benefit-icon-wrapper">
              <div className="benefit-icon">🎯</div>
            </div>
            <h3 className="benefit-heading">Personalized for Every Learner</h3>
            <p className="benefit-text">
              <em>Whether you're in secondary school or postgraduate studies, content is tailored by level, subject, and learning style—voice, slides, or text.</em>
            </p>
            <div className="benefit-accent"></div>
          </div>

          <div className="benefit-box ai-powered">
            <div className="benefit-icon-wrapper">
              <div className="benefit-icon">🤖</div>
            </div>
            <h3 className="benefit-heading">AI That Teaches Like a Human</h3>
            <p className="benefit-text">
              <em>We combine conversational AI, smart voiceovers, and structured slides to deliver content that feels like a one-on-one tutoring session.</em>
            </p>
            <div className="benefit-accent"></div>
          </div>

          <div className="benefit-box future-proof">
            <div className="benefit-icon-wrapper">
              <div className="benefit-icon">🚀</div>
            </div>
            <h3 className="benefit-heading">Future-Proof Learning</h3>
            <p className="benefit-text">
              <em>We don't just explain topics—we build critical thinking, digital skills, and readiness for AI-powered careers.</em>
            </p>
            <div className="benefit-accent"></div>
          </div>
        </div>
      </section>
    </div>
  );
}