const features = [
  {
    title: "Instant Dream Analysis",
    desc: "Get detailed interpretations in seconds, not days. Our AI processes your dreams immediately with 95% accuracy.",
    emoji: "⚡",
    metric: "< 10 sec",
    metricLabel: "Analysis Time"
  },
  {
    title: "Personal Growth Insights", 
    desc: "Turn your dreams into actionable insights for relationships, career, and self-development.",
    emoji: "🎯",
    metric: "80%",
    metricLabel: "Report Clarity"
  },
  {
    title: "Pattern Recognition",
    desc: "Track recurring themes and symbols to understand your subconscious patterns over time.",
    emoji: "📊",
    metric: "50+",
    metricLabel: "Tracked Symbols"
  },
  {
    title: "Privacy First",
    desc: "Your dreams are encrypted and private. We never share your personal data with anyone.",
    emoji: "🔒",
    metric: "100%",
    metricLabel: "Secure"
  },
  {
    title: "Science-Backed",
    desc: "Built on Jungian psychology and modern dream research for accurate, meaningful interpretations.",
    emoji: "🧠",
    metric: "15+",
    metricLabel: "Studies Used"
  },
  {
    title: "Mobile Ready",
    desc: "Record dreams instantly when you wake up. Available on iOS and Android soon.",
    emoji: "📱",
    metric: "24/7",
    metricLabel: "Available"
  }
];

export default function ServiceIntro() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="features-header">
          <h2 className="features-title">Why Nova Dream Works Better</h2>
          <p className="features-subtitle">
            Other dream apps give you generic interpretations. We give you personalized insights that actually help you grow.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={feature.title} className="feature-card glass glass-hover" style={{animationDelay: `${index * 100}ms`}}>
              <div className="feature-header">
                <span className="feature-icon">{feature.emoji}</span>
                <div className="feature-metric">
                  <span className="metric-number">{feature.metric}</span>
                  <span className="metric-label">{feature.metricLabel}</span>
                </div>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="features-cta">
          <p className="features-cta-text">Ready to understand your dreams?</p>
          <a href="#waitlist" className="btn btn-primary">Join the Waitlist</a>
        </div>
      </div>
    </section>
  );
}