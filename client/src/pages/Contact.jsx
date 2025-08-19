// src/pages/Contact.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../services/supabaseClient'
import './Contact.css'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (field, value) => {
    setFormData((prev) => ({...prev, [field]: value}))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {error} = await supabase
        .from('contact_messages')
        .insert([{
          ...formData,
          created_at: new Date().toISOString()
        }])

      if (error) throw error

      setSuccess(true)
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      })
    } catch (error) {
      console.error('Error submitting contact form:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>
        <h1>📞 Contact Us</h1>
      </header>

      <div className="contact-container">
        <div className="contact-info">
          <h2>Get in Touch</h2>
          <p>We're here to help you succeed in your learning journey. Reach out to us!</p>
          
          <div className="contact-methods">
            <div className="contact-method">
              <span className="icon">📧</span>
              <div>
                <strong>Email</strong>
                <p>support@bbedtech.ai</p>
              </div>
            </div>
            
            <div className="contact-method">
              <span className="icon">🌐</span>
              <div>
                <strong>Website</strong>
                <p>www.bbedtech.ai</p>
              </div>
            </div>
            
            <div className="contact-method">
              <span className="icon">🐙</span>
              <div>
                <strong>GitHub</strong>
                <p>github.com/BBindustrials</p>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-section">
          {success ? (
            <div className="success-message">
              <h3>✅ Message Sent Successfully!</h3>
              <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
              <button onClick={() => setSuccess(false)} className="new-message-btn">
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <h3>Send us a Message</h3>
              
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </div>

              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Support</option>
                <option value="billing">Billing Question</option>
                <option value="feature">Feature Request</option>
                <option value="bug">Bug Report</option>
              </select>

              <input
                type="text"
                placeholder="Subject"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                required
              />

              <textarea
                placeholder="Your Message"
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                rows={6}
                required
              />

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Contact
