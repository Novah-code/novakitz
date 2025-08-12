const testimonials = [
  {
    name: "Sarah Kim",
    role: "UX Designer",
    content: "Nova Dream helped me realize my anxiety dreams were actually about impostor syndrome at work. The insights were spot-on and actionable.",
    avatar: "👩🏻‍💼",
    rating: 5
  },
  {
    name: "Michael Chen", 
    role: "Entrepreneur",
    content: "I've been tracking my dreams for months. The pattern analysis showed me how my stress affects my sleep quality. Game-changer.",
    avatar: "👨🏻‍💻",
    rating: 5
  },
  {
    name: "Jessica Park",
    role: "Student",
    content: "Finally, dream interpretation that doesn't sound like fortune telling. The psychology-based approach actually makes sense.",
    avatar: "👩🏻‍🎓",
    rating: 5
  }
];

const stats = [
  { number: "2,500+", label: "Early Access Users" },
  { number: "10,000+", label: "Dreams Analyzed" },
  { number: "4.9/5", label: "User Rating" },
  { number: "95%", label: "Accuracy Rate" }
];

export default function Testimonials() {
  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <div className="testimonials-header">
          <h2 className="testimonials-title">Loved by Dream Enthusiasts</h2>
          <p className="testimonials-subtitle">
            Join thousands who are already using Nova Dream to understand their subconscious mind
          </p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={stat.label} className="stat-card glass" style={{animationDelay: `${index * 150}ms`}}>
              <span className="stat-number">{stat.number}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={testimonial.name} className="testimonial-card glass glass-hover" style={{animationDelay: `${index * 200}ms`}}>
              <div className="testimonial-content">
                <div className="stars">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="star">⭐</span>
                  ))}
                </div>
                <p className="testimonial-text">"{testimonial.content}"</p>
              </div>
              <div className="testimonial-author">
                <span className="author-avatar">{testimonial.avatar}</span>
                <div className="author-info">
                  <span className="author-name">{testimonial.name}</span>
                  <span className="author-role">{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="social-proof">
          <p className="social-proof-text">
            🔥 Trending #3 in Personal Development • Featured in TechCrunch, Product Hunt
          </p>
        </div>
      </div>
    </section>
  );
}