export default function HeroSection() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content glass-strong glass-hover">
          <div className="launch-badge">
            🚀 Launching on Product Hunt Soon!
          </div>
          <span className="hero-emoji">🌙</span>
          <h1 className="hero-title">Turn Your Dreams Into Personal Growth</h1>
          <p className="hero-subtitle">AI-powered dream interpretation that actually makes sense</p>
          <p className="hero-description">
            Stop wondering what your dreams mean. Nova Dream uses advanced AI to decode your subconscious mind, 
            giving you personalized insights that help you understand yourself better and grow as a person.
          </p>
          
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Dreams Analyzed</span>
            </div>
            <div className="stat">
              <span className="stat-number">95%</span>
              <span className="stat-label">Accuracy Rate</span>
            </div>
            <div className="stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">AI Available</span>
            </div>
          </div>

          <div className="cta-section">
            <div className="flex gap-4 justify-center flex-wrap">
              <a href="#waitlist" className="btn btn-primary btn-large">
                Get Early Access
                <span className="btn-icon">🎯</span>
              </a>
              <a href="#demo" className="btn btn-secondary">
                Watch Demo
                <span className="btn-icon">▶️</span>
              </a>
            </div>
            <p className="early-access-note">
              Join 2,500+ people getting exclusive early access • No spam, ever
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}