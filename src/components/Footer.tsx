export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content glass">
          <div className="footer-main">
            <div className="footer-brand">
              <h3 className="footer-logo">🌙 Nova Dream</h3>
              <p className="footer-tagline">
                AI-powered dream interpretation that helps you grow
              </p>
            </div>
            
            <div className="footer-links">
              <div className="link-group">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#testimonials">Reviews</a>
                <a href="#waitlist">Early Access</a>
              </div>
              <div className="link-group">
                <h4>Launch</h4>
                <a href="https://producthunt.com/@novadream" target="_blank">Product Hunt</a>
                <a href="#waitlist">Join Waitlist</a>
                <a href="mailto:press@novadream.ai">Press Kit</a>
              </div>
              <div className="link-group">
                <h4>Connect</h4>
                <a href="https://twitter.com/novadream_ai" target="_blank">Twitter</a>
                <a href="https://instagram.com/novadream.ai" target="_blank">Instagram</a>
                <a href="mailto:contact@novakitz.shop">Contact</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom-section">
            <div className="launch-status">
              <span className="status-badge">🚀 Launching on Product Hunt Soon</span>
              <p>Be part of our launch day success story</p>
            </div>
            
            <div className="footer-legal">
              <p className="footer-bottom">
                © {new Date().getFullYear()} NovaKits. All rights reserved.
              </p>
              <div className="legal-links">
                <a href="/legal/terms">Terms of Service</a>
                <a href="/legal/privacy">Privacy Policy</a>
                <a href="/legal/refund">Refund Policy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}