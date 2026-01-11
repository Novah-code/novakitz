'use client';

import { useState } from 'react';

export default function EmailForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        setSubmitted(true);
        setEmail('');
        setIsLoading(false);
        
        // Hide success message after 8 seconds
        setTimeout(() => {
          setSubmitted(false);
        }, 8000);
      }, 1000);
    }
  };

  return (
    <section className="coming-soon" id="waitlist">
      <div className="container">
        <div className="coming-soon-content glass-strong glass-hover">
          <div className="launch-countdown">
            <span className="countdown-badge"> Product Hunt Launch</span>
            <h2 className="coming-soon-title">Get Exclusive Early Access</h2>
          </div>
          
          <div className="launch-benefits">
            <div className="benefit">
              <span className="benefit-icon">⚡</span>
              <span>50% off lifetime access</span>
            </div>
            <div className="benefit">
              <span className="benefit-icon">🎁</span>
              <span>Free premium features for 6 months</span>
            </div>
            <div className="benefit">
              <span className="benefit-icon">👥</span>
              <span>Private beta community access</span>
            </div>
          </div>

          <p className="coming-soon-subtitle">
            Join 2,500+ early adopters who will get first access when we launch on Product Hunt
          </p>
          
          <form className="email-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                id="emailInput"
                className="email-input"
                placeholder="Enter your email for early access"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || submitted}
              />
              <button 
                type="submit" 
                className={`btn btn-primary btn-large ${isLoading ? 'loading' : ''}`}
                disabled={isLoading || submitted}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Joining...
                  </>
                ) : submitted ? (
                  <>
                    <span>✅</span>
                    You're in!
                  </>
                ) : (
                  <>
                    Get Early Access
                    <span className="btn-icon">🎯</span>
                  </>
                )}
              </button>
            </div>
          </form>
          
          {submitted && (
            <div className="success-message show" id="successMessage">
               Welcome to the Nova Dream family! 
              <br />
              <small>We'll notify you 24hrs before our Product Hunt launch with your exclusive discount code.</small>
            </div>
          )}
          
          <div className="trust-indicators">
            <div className="trust-item">
              <span className="trust-icon">🔒</span>
              <span>No spam, unsubscribe anytime</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">⚡</span>
              <span>Launch notification + 50% discount</span>
            </div>
          </div>

          <div className="social-proof-mini">
            <div className="avatars">
              <span className="avatar">👩🏻‍💼</span>
              <span className="avatar">👨🏻‍💻</span>
              <span className="avatar">👩🏻‍🎓</span>
              <span className="avatar">👨🏻‍🎨</span>
              <span className="avatar-count">+2.5K</span>
            </div>
            <p className="social-proof-text">Join 2,500+ people waiting for launch</p>
          </div>
        </div>
      </div>
    </section>
  );
}