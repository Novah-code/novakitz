import DreamApp from '../src/components/DreamApp';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <>
      <main id="app">
        <DreamApp />
      </main>

      <footer className="app-footer">
        <div className="container">
          <div className="footer-content glass">
            <div className="footer-brand">
              <div className="logo">🍵 Novakitz</div>
              <p className="footer-tagline">
                Discover what's brewing in your subconscious mind
              </p>
            </div>
            
            <div className="footer-info">
              <p className="disclaimer">
                Dream interpretations are for entertainment and self-reflection purposes. 
                Always trust your own intuition and seek professional guidance when needed.
              </p>
              
              <div className="footer-links-simple">
                <a href="/privacy">Privacy</a>
                <a href="/terms">Terms</a>
                <a href="mailto:hello@novakitz.com">Contact</a>
              </div>
              
              <p className="copyright">
                © 2025 Novakitz. Made with matcha love 🍵
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
