// src/pages/Pricing.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import './Pricing.css'

const Pricing = () => {
  const plans = [
    {
      name: 'Student',
      price: '₦2,500',
      period: '/month',
      features: [
        'Unlimited Confusion Solver sessions',
        'Basic Math Solver',
        '10 Socratic Tutor sessions/month',
        'Learning history tracking',
        'Mobile app access'
      ],
      popular: false
    },
    {
      name: 'Premium',
      price: '₦5,000',
      period: '/month',
      features: [
        'Everything in Student plan',
        'Unlimited Socratic Tutor sessions',
        'Advanced Math Solver with step explanations',
        'Adaptive Tutor with personalized learning',
        'IDD Helper for special needs support',
        'Export learning summaries',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Institution',
      price: '₦15,000',
      period: '/month',
      features: [
        'Everything in Premium plan',
        'Multi-user management (up to 50 students)',
        'Teacher dashboard and analytics',
        'Bulk session management',
        'Custom branding options',
        'API access',
        'Dedicated support'
      ],
      popular: false
    }
  ]

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
        <h1>💰 Pricing Plans</h1>
      </header>

      <div className="pricing-container">
        <div className="pricing-intro">
          <h2>Choose Your Learning Journey</h2>
          <p>Unlock the full potential of AI-powered education with BB EDTECH.AI</p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              
              <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">
                  <span className="price">{plan.price}</span>
                  <span className="period">{plan.period}</span>
                </div>
              </div>

              <ul className="features-list">
                {plan.features.map((feature, index) => (
                  <li key={index} className="feature-item">
                    <span className="checkmark">✅</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={`subscribe-btn ${plan.popular ? 'popular-btn' : ''}`}>
                Get Started
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-footer">
          <p>All plans include a 7-day free trial. No credit card required.</p>
          <p>Need a custom solution? <Link to="/contact">Contact us</Link> for enterprise pricing.</p>
        </div>
      </div>
    </div>
  )
}

export default Pricing
