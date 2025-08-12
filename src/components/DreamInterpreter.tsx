'use client';

import { useState } from 'react';

interface DreamInterpretation {
  summary: string;
  symbols: Array<{ symbol: string; meaning: string; }>;
  insights: string[];
  guidance: string;
}

// Demo interpretation database
const dreamKeywords = {
  water: {
    meanings: ["emotions", "subconscious mind", "cleansing", "renewal"],
    guidance: "Water in dreams often represents your emotional state. Consider what emotions you've been processing lately."
  },
  flying: {
    meanings: ["freedom", "liberation", "rising above challenges", "spiritual ascension"],
    guidance: "Flying dreams suggest you're overcoming obstacles or seeking freedom in your waking life."
  },
  falling: {
    meanings: ["loss of control", "anxiety", "fear of failure", "letting go"],
    guidance: "Falling dreams may indicate feelings of being overwhelmed. Consider what areas of life feel out of control."
  },
  animals: {
    meanings: ["instincts", "wild nature", "repressed desires", "primal energy"],
    guidance: "Animals in dreams connect you to your instinctual nature and hidden aspects of personality."
  },
  house: {
    meanings: ["self", "psyche", "family", "security", "personal space"],
    guidance: "Houses represent your inner self. Different rooms may symbolize different aspects of your personality."
  },
  death: {
    meanings: ["transformation", "endings", "new beginnings", "fear of change"],
    guidance: "Death in dreams rarely means literal death. It usually represents transformation and new phases of life."
  },
  fire: {
    meanings: ["passion", "anger", "purification", "destruction and renewal"],
    guidance: "Fire represents intense emotions or situations that bring both destruction and renewal."
  },
  lost: {
    meanings: ["confusion", "lack of direction", "search for identity", "feeling disconnected"],
    guidance: "Being lost suggests you may be searching for direction or purpose in your current life path."
  },
  chase: {
    meanings: ["avoidance", "fear", "running from problems", "pursuit of goals"],
    guidance: "Being chased often means you're avoiding something in waking life that needs to be confronted."
  },
  love: {
    meanings: ["connection", "self-acceptance", "desire", "emotional fulfillment"],
    guidance: "Love dreams reflect your need for connection and may show your relationship with yourself and others."
  }
};

export default function DreamInterpreter() {
  const [dreamText, setDreamText] = useState('');
  const [interpretation, setInterpretation] = useState<DreamInterpretation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const analyzeDream = () => {
    if (!dreamText.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const foundSymbols: Array<{ symbol: string; meaning: string; }> = [];
      const insights: string[] = [];
      
      // Analyze dream text for keywords
      const lowerText = dreamText.toLowerCase();
      
      Object.entries(dreamKeywords).forEach(([keyword, data]) => {
        if (lowerText.includes(keyword) || 
            (keyword === 'animals' && /dog|cat|bird|snake|lion|tiger|bear|wolf/.test(lowerText)) ||
            (keyword === 'water' && /sea|ocean|river|lake|rain|swimming/.test(lowerText)) ||
            (keyword === 'house' && /home|room|building|door|window/.test(lowerText)) ||
            (keyword === 'lost' && /lost|missing|can't find|searching/.test(lowerText)) ||
            (keyword === 'chase' && /chasing|running|escape|pursue/.test(lowerText))) {
          
          foundSymbols.push({
            symbol: keyword.charAt(0).toUpperCase() + keyword.slice(1),
            meaning: data.meanings[Math.floor(Math.random() * data.meanings.length)]
          });
          insights.push(data.guidance);
        }
      });

      // If no keywords found, provide general interpretation
      if (foundSymbols.length === 0) {
        foundSymbols.push({
          symbol: "Dream Journey",
          meaning: "personal exploration and self-discovery"
        });
        insights.push("Your dream reflects your subconscious mind processing daily experiences and emotions. Consider what stood out most to you in this dream.");
      }

      const result: DreamInterpretation = {
        summary: generateSummary(foundSymbols),
        symbols: foundSymbols.slice(0, 3), // Limit to 3 symbols
        insights: insights.slice(0, 2), // Limit to 2 insights
        guidance: generateGuidance(foundSymbols)
      };

      setInterpretation(result);
      setIsAnalyzing(false);
      setShowEmailForm(true);
    }, 3000); // 3 second analysis time
  };

  const generateSummary = (symbols: Array<{ symbol: string; meaning: string; }>) => {
    const themes = symbols.map(s => s.meaning).join(', ');
    return `Your dream reveals themes of ${themes}. This suggests your subconscious is processing important aspects of your personal growth and emotional development.`;
  };

  const generateGuidance = (symbols: Array<{ symbol: string; meaning: string; }>) => {
    const guidanceOptions = [
      "Consider journaling about these themes to gain deeper insights into your subconscious mind.",
      "Reflect on how these symbols might relate to current challenges or opportunities in your life.",
      "Pay attention to recurring patterns in your dreams - they often carry important messages.",
      "Use this interpretation as a starting point for self-reflection and personal growth."
    ];
    return guidanceOptions[Math.floor(Math.random() * guidanceOptions.length)];
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setEmailSubmitted(true);
      setTimeout(() => {
        setEmailSubmitted(false);
      }, 5000);
    }
  };

  const resetDream = () => {
    setDreamText('');
    setInterpretation(null);
    setShowEmailForm(false);
    setEmail('');
    setEmailSubmitted(false);
  };

  return (
    <section className="dream-interpreter">
      <div className="container">
        {!interpretation ? (
          <div className="dream-input-section">
            <div className="dream-header">
              <h1 className="dream-title">What's brewing in your dreams?</h1>
              <p className="dream-subtitle">
                Share your dream and discover what your subconscious is trying to tell you ✨
              </p>
            </div>

            <div className="dream-input-card glass-strong">
              <textarea
                value={dreamText}
                onChange={(e) => setDreamText(e.target.value)}
                placeholder="Describe your dream in detail... The more you share, the better the interpretation will be. Include people, places, emotions, colors, and any symbols you remember."
                className="dream-textarea"
                rows={8}
                disabled={isAnalyzing}
              />
              
              <div className="dream-input-footer">
                <div className="input-info">
                  <span className="char-count">{dreamText.length}/1000 characters</span>
                  <span className="privacy-note">🔒 Your dreams are private and secure</span>
                </div>
                
                <button
                  onClick={analyzeDream}
                  disabled={!dreamText.trim() || isAnalyzing}
                  className={`btn btn-primary btn-large ${isAnalyzing ? 'loading' : ''}`}
                >
                  {isAnalyzing ? (
                    <>
                      <span className="spinner"></span>
                      Interpreting your dream...
                    </>
                  ) : (
                    <>
                      Interpret My Dream
                      <span className="btn-icon">🔮</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="sample-dreams">
              <p className="sample-title">Need inspiration? Try these:</p>
              <div className="sample-buttons">
                <button 
                  className="sample-btn"
                  onClick={() => setDreamText("I was flying over a beautiful ocean, feeling completely free and peaceful. The water was crystal clear and I could see colorful fish swimming below.")}
                >
                  Flying Dream 🕊️
                </button>
                <button 
                  className="sample-btn"
                  onClick={() => setDreamText("I was in my childhood home but the rooms kept changing. I kept getting lost trying to find my way to my bedroom.")}
                >
                  Lost in House 🏠
                </button>
                <button 
                  className="sample-btn"
                  onClick={() => setDreamText("I was being chased by a shadowy figure through a forest. I was running as fast as I could but felt like I wasn't moving.")}
                >
                  Being Chased 🏃‍♂️
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="interpretation-section">
            <div className="interpretation-header">
              <h2 className="interpretation-title">Your Dream Interpretation</h2>
              <button onClick={resetDream} className="btn btn-secondary">
                Interpret Another Dream
              </button>
            </div>

            <div className="interpretation-content">
              <div className="interpretation-summary glass">
                <h3>Dream Summary</h3>
                <p>{interpretation.summary}</p>
              </div>

              <div className="symbols-grid">
                {interpretation.symbols.map((symbol, index) => (
                  <div key={index} className="symbol-card glass glass-hover">
                    <h4>{symbol.symbol}</h4>
                    <p>Represents: <strong>{symbol.meaning}</strong></p>
                  </div>
                ))}
              </div>

              <div className="insights-section">
                <h3>Personal Insights</h3>
                <div className="insights-list">
                  {interpretation.insights.map((insight, index) => (
                    <div key={index} className="insight-card glass">
                      <span className="insight-icon">💡</span>
                      <p>{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="guidance-section glass-strong">
                <h3>Guidance for Growth</h3>
                <p>{interpretation.guidance}</p>
              </div>
            </div>

            {showEmailForm && !emailSubmitted && (
              <div className="email-collection glass-strong">
                <h3>Want deeper dream insights?</h3>
                <p>Get personalized dream analysis tips and unlock advanced interpretations</p>
                
                <form onSubmit={handleEmailSubmit} className="interpretation-email-form">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for advanced insights"
                    className="email-input"
                    required
                  />
                  <button type="submit" className="btn btn-primary">
                    Get Advanced Insights
                  </button>
                </form>
              </div>
            )}

            {emailSubmitted && (
              <div className="email-success glass">
                <h3>🎉 Thank you!</h3>
                <p>Check your email for advanced dream interpretation techniques and personalized insights!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}